import React, { useMemo, useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Modal, Alert, Keyboard, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { theme } from '@/constants/theme';
import { GlassCard } from '@/components/GlassCard';
import { askGroq, ChatMessage } from '@/lib/groq';
import Markdown from 'react-native-markdown-display';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Plus, History, Edit3, Trash2, MessageSquare } from 'lucide-react-native';
import { useToast } from '@/contexts/ToastContext';

type Message = { id: string; role: 'user' | 'assistant'; content: string };
type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
};

const STORAGE_KEY = '@chat_sessions_v1';
const WELCOME: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Hi! I’m your childcare assistant. Ask me about sleep schedules, soothing techniques, feeding, and general baby care.',
};

export default function ChatbotScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const controllerRef = useRef<AbortController | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTitle, setRenameTitle] = useState('');
  const [renameId, setRenameId] = useState<string | null>(null);

  const systemPrompt: ChatMessage = useMemo(() => ({
    role: 'system',
    content: [
      'You are a friendly, supportive childcare assistant specialized in infant care (0-24 months).',
      'Provide practical, evidence-aligned tips on sleep routines, feeding, soothing, growth milestones, hygiene, safety, illness warning signs, and caregiver self-care.',
      'Do not give medical diagnoses. For medical concerns, clearly state you are not a medical professional and advise contacting a pediatrician or emergency services when appropriate.',
      'Be concise, structured, and empathetic. Use bullet points when helpful.',
      'Use a cheerful, warm tone with friendly emojis where appropriate (😊👶🍼). Keep emojis tasteful and supportive; avoid overuse.',
    ].join(' '),
  }), []);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const id = `${Date.now()}`;
    const newUserMsg: Message = { id, role: 'user', content: input.trim() };
    setMessages(prev => [...prev, newUserMsg]);
    setInput('');
    setLoading(true);

    controllerRef.current?.abort();
    controllerRef.current = new AbortController();

    try {
      const history: ChatMessage[] = [
        systemPrompt,
        ...messages.map(m => ({ role: m.role, content: m.content } as ChatMessage)),
        { role: 'user', content: newUserMsg.content }
      ];
      const content = await askGroq(history, controllerRef.current.signal);
      const reply = { id: `${Date.now()}-assistant`, role: 'assistant', content } as Message;
      setMessages(prev => [...prev, reply]);
      // persist into session
      if (activeId) {
        setSessions(prev => prev.map(s => s.id === activeId ? ({ ...s, messages: [...prev.find(p => p.id===activeId)?.messages || [], newUserMsg, reply], updatedAt: Date.now() }) : s));
      }
    } catch (e: any) {
      const errMsg = `Sorry, I had trouble replying: ${e?.message || 'Unknown error'}`;
      setMessages(prev => [...prev, { id: `${Date.now()}-error`, role: 'assistant', content: errMsg }]);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Auto-scroll when messages update
  useEffect(() => {
    if (flatListRef.current) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  // Move floating input with keyboard
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e: any) => {
      const height = e?.endCoordinates?.height ?? 0;
      setKeyboardOffset(height);
    };
    const onHide = () => setKeyboardOffset(0);

    const subShow = Keyboard.addListener(showEvent as any, onShow);
    const subHide = Keyboard.addListener(hideEvent as any, onHide);
    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, []);

  // Load sessions on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as ChatSession[];
          setSessions(parsed);
          const first = parsed[0];
          if (first) {
            setActiveId(first.id);
            setMessages(first.messages);
          }
        } else {
          const first: ChatSession = {
            id: `${Date.now()}`,
            title: 'New chat',
            messages: [WELCOME],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          setSessions([first]);
          setActiveId(first.id);
        }
      } catch (e) {
        console.warn('Failed to load chat sessions', e);
      }
    })();
  }, []);

  const persist = async (next: ChatSession[]) => {
    setSessions(next);
    try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  const newChat = async () => {
    const chat: ChatSession = {
      id: `${Date.now()}`,
      title: 'New chat',
      messages: [WELCOME],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const next = [chat, ...sessions];
    await persist(next);
    setActiveId(chat.id);
    setMessages(chat.messages);
    setHistoryOpen(false);
    toast.success('New chat created');
  };

  const openChat = async (id: string) => {
    const s = sessions.find(s => s.id === id);
    if (!s) return;
    setActiveId(id);
    setMessages(s.messages);
    setHistoryOpen(false);
  };

  const requestRename = (id: string) => {
    const s = sessions.find(s => s.id === id);
    if (!s) return;
    setRenameId(id);
    setRenameTitle(s.title);
    setRenameOpen(true);
  };

  const confirmRename = async () => {
    if (!renameId) return;
    const title = renameTitle.trim() || 'Untitled';
    const next = sessions.map(s => s.id === renameId ? { ...s, title, updatedAt: Date.now() } : s);
    await persist(next);
    setRenameOpen(false);
    setRenameId(null);
    toast.success('Chat renamed');
  };

  const deleteChat = async (id: string) => {
    Alert.alert('Delete chat?', 'This will permanently remove the conversation.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const next = sessions.filter(s => s.id !== id);
        if (next.length === 0) {
          const fresh: ChatSession = { id: `${Date.now()}`, title: 'New chat', messages: [WELCOME], createdAt: Date.now(), updatedAt: Date.now() };
          await persist([fresh]);
          setActiveId(fresh.id);
          setMessages(fresh.messages);
        } else {
          await persist(next);
          const chosen = next[0];
          setActiveId(chosen.id);
          setMessages(chosen.messages);
        }
        toast.success('Chat deleted');
      } }
    ]);
  };

  const deleteAll = async () => {
    Alert.alert('Clear all chats?', 'This will remove your entire chat history.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: async () => {
        const fresh: ChatSession = { id: `${Date.now()}`, title: 'New chat', messages: [WELCOME], createdAt: Date.now(), updatedAt: Date.now() };
        await persist([fresh]);
        setActiveId(fresh.id);
        setMessages(fresh.messages);
        setHistoryOpen(false);
        toast.info('All chats cleared');
      } }
    ]);
  };

  const renderItem = ({ item }: { item: Message }) => (
    <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
      {item.role === 'assistant' ? (
        <Markdown style={markdownStyles}>{item.content}</Markdown>
      ) : (
        <Text style={styles.bubbleText}>{item.content}</Text>
      )}
    </View>
  );

  return (
    <LinearGradient colors={[theme.colors.background, theme.colors.secondary]} style={styles.container}>
      <View style={styles.flex}>
        {/* Header */}
        <View style={[styles.headerWrap, { paddingTop: Math.max(60, insets.top + 20) }]}>
          <GlassCard className="rounded-3xl border border-glassBorder" contentClassName="p-md">
            <View style={styles.headerRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MessageSquare size={18} color={theme.colors.primary} />
                <TouchableOpacity onPress={() => setHistoryOpen(true)} accessibilityLabel="Open chat history">
                  <Text style={[styles.title, { marginLeft: 8 }]} numberOfLines={1}>
                    {sessions.find(s => s.id === activeId)?.title || 'Childcare Chatbot'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity onPress={newChat} style={styles.iconBtn} accessibilityLabel="New chat">
                  <Plus size={18} color={theme.colors.text} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setHistoryOpen(true)} style={styles.iconBtn} accessibilityLabel="Open chat history">
                  <History size={18} color={theme.colors.text} />
                </TouchableOpacity>
              </View>
            </View>
          </GlassCard>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.listContent, { paddingBottom: 110 + keyboardOffset }]} // add bottom space for floating input and keyboard
        />

        {/* Floating Capsule Input */}
        <View style={[styles.floatingInput, { bottom: insets.bottom + 10 + keyboardOffset }]}>
          <GlassCard style={styles.inputCard} contentClassName="p-0">
            <View style={styles.inputRow}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Ask about sleep, feeding, soothing..."
                placeholderTextColor={theme.colors.textSecondary}
                style={styles.input}
                editable={!loading}
                onSubmitEditing={sendMessage}
                returnKeyType="send"
              />
              <TouchableOpacity onPress={sendMessage} disabled={loading} style={styles.sendBtn}>
                {loading ? <ActivityIndicator color={theme.colors.text} /> :
                  <Text style={styles.sendText}>Send</Text>
                }
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>
      </View>

      {/* History Modal - glassmorphic floating card */}
      <Modal visible={historyOpen} animationType="fade" transparent onRequestClose={() => setHistoryOpen(false)}>
        <View style={styles.glassBackdrop}>
          <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.backdropTint} />
          <View style={styles.glassCenter}>
            <GlassCard style={styles.glassCard} contentClassName="p-0">
              <View style={{ padding: theme.spacing.lg }}>
                <Text style={styles.modalTitle}>Chats</Text>
              </View>
              <View style={{ paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.lg }}>
                <FlatList
                  data={sessions}
                  keyExtractor={(s) => s.id}
                  renderItem={({ item }) => (
                    <View style={[styles.chatRow, activeId === item.id && styles.chatRowActive]}>
                      <TouchableOpacity style={{ flex: 1 }} onPress={() => openChat(item.id)}>
                        <Text style={styles.chatTitle} numberOfLines={1}>{item.title}</Text>
                        <Text style={styles.chatSubtitle}>{new Date(item.updatedAt).toLocaleString()}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => requestRename(item.id)} style={styles.rowIcon}>
                        <Edit3 size={18} color={theme.colors.textSecondary} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => deleteChat(item.id)} style={styles.rowIcon}>
                        <Trash2 size={18} color={theme.colors.error} />
                      </TouchableOpacity>
                    </View>
                  )}
                  ItemSeparatorComponent={() => <View style={styles.rowDivider} />}
                  ListFooterComponent={() => (
                    <View style={{ marginTop: theme.spacing.lg }}>
                      <TouchableOpacity onPress={newChat} style={styles.primaryBtn}>
                        <Text style={styles.primaryBtnText}>New chat</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={deleteAll} style={[styles.secondaryBtn, { marginTop: theme.spacing.sm }]}>
                        <Text style={styles.secondaryBtnText}>Clear all</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  contentContainerStyle={{ paddingBottom: 8 }}
                  style={{ maxHeight: 360 }}
                />
                <TouchableOpacity onPress={() => setHistoryOpen(false)} style={[styles.closeBtn, { alignSelf: 'center' }]}>
                  <Text style={styles.closeBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </View>
        </View>
      </Modal>

      {/* Rename Modal */}
      <Modal visible={renameOpen} transparent animationType="fade" onRequestClose={() => setRenameOpen(false)}>
        <View style={styles.renameBackdrop}>
          <View style={styles.renameCard}>
            <Text style={styles.modalTitle}>Rename chat</Text>
            <TextInput
              value={renameTitle}
              onChangeText={setRenameTitle}
              placeholder="Enter new title"
              placeholderTextColor={theme.colors.textSecondary}
              style={styles.renameInput}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity onPress={() => setRenameOpen(false)} style={styles.secondaryBtn}>
                <Text style={styles.secondaryBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmRename} style={[styles.primaryBtn, { marginLeft: theme.spacing.sm }]}>
                <Text style={styles.primaryBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  headerWrap: { padding: theme.spacing.lg, paddingTop: 60 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { padding: 8, marginLeft: 8 },
  title: {
    color: theme.colors.text,
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold as any,
    marginBottom: theme.spacing.xs,
  },
  listContent: { padding: theme.spacing.lg },
  bubble: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    maxWidth: '90%',
  },
  userBubble: { backgroundColor: theme.colors.primary, alignSelf: 'flex-end' },
  assistantBubble: { backgroundColor: 'rgba(255,255,255,0.06)', alignSelf: 'flex-start' },
  bubbleText: { color: theme.colors.text, fontSize: theme.fontSize.md },
  floatingInput: {
    position: 'absolute',
    left: 10,
    right: 10,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  inputCard: { padding: 0, borderRadius: 50 },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: {
    flex: 1,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    fontSize: theme.fontSize.md,
  },
  sendBtn: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderLeftWidth: 1,
    borderLeftColor: theme.colors.glassBorder,
    borderTopRightRadius: 50,
    borderBottomRightRadius: 50,
  },
  sendText: { color: theme.colors.text, fontWeight: theme.fontWeight.bold as any },
  // Modals
  glassBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backdropTint: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.25)' },
  glassCenter: { width: '92%' },
  glassCard: { borderRadius: 20, overflow: 'hidden', maxHeight: '75%' },
  modalTitle: { color: theme.colors.text, fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold as any, marginBottom: theme.spacing.md },
  chatRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: theme.spacing.sm },
  chatRowActive: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, paddingHorizontal: 6 },
  chatTitle: { color: theme.colors.text, fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.medium as any },
  chatSubtitle: { color: theme.colors.textSecondary, fontSize: theme.fontSize.xs },
  rowIcon: { padding: 8, marginLeft: 4 },
  rowDivider: { height: 1, backgroundColor: theme.colors.glassBorder, marginVertical: 6 },
  closeBtn: { alignSelf: 'center', marginTop: theme.spacing.md, paddingVertical: 10, paddingHorizontal: 16 },
  closeBtnText: { color: theme.colors.textSecondary },
  primaryBtn: { backgroundColor: theme.colors.primary, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, alignSelf: 'flex-start' },
  primaryBtnText: { color: '#000', fontWeight: theme.fontWeight.bold as any },
  secondaryBtn: { backgroundColor: 'rgba(255,255,255,0.06)', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  secondaryBtnText: { color: theme.colors.text },
  renameBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  renameCard: { width: '88%', backgroundColor: theme.colors.secondary, padding: theme.spacing.lg, borderRadius: 16 },
  renameInput: { color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.glassBorder, borderRadius: 10, padding: 12, marginBottom: theme.spacing.md },
}) as any;

const markdownStyles = {
  body: { color: theme.colors.text, fontSize: theme.fontSize.md },
  paragraph: { marginBottom: 8 },
  strong: { fontWeight: theme.fontWeight.bold as any },
  bullet_list: { marginBottom: 6 },
  list_item: { marginBottom: 4 },
  code_inline: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  code_block: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 10,
    borderRadius: 8,
  },
} as const;
