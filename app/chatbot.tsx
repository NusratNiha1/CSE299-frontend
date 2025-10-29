import React, { useMemo, useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/constants/theme';
import { GlassCard } from '@/components/GlassCard';
import { askGroq, ChatMessage } from '@/lib/groq';
import Markdown from 'react-native-markdown-display';

type Message = { id: string; role: 'user' | 'assistant'; content: string };

export default function ChatbotScreen() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([{
    id: 'welcome',
    role: 'assistant',
    content: 'Hi! I’m your childcare assistant. Ask me about sleep schedules, soothing techniques, feeding, and general baby care.'
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const flatListRef = useRef<FlatList>(null);

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
      setMessages(prev => [...prev, { id: `${Date.now()}-assistant`, role: 'assistant', content }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { id: `${Date.now()}-error`, role: 'assistant', content: `Sorry, I had trouble replying: ${e?.message || 'Unknown error'}` }]);
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
            <Text style={styles.title}>Childcare Chatbot</Text>
          </GlassCard>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]} // add bottom space for floating input
        />

        {/* Floating Capsule Input */}
        <View style={[styles.floatingInput, { bottom: insets.bottom + 10 }]}>
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  headerWrap: { padding: theme.spacing.lg, paddingTop: 60 },
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
