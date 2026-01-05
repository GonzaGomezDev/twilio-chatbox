import api from '@/lib/api';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import echo from '@/lib/echo';
import Message from './message';
import { useToast } from '@/contexts/toast-context';

interface Conversation {
    id: number;
    name?: string | null;
    phone_number: string;
}

interface Message {
    id: number;
    content: string;
    is_outgoing: boolean;
    files?: { url: string; type: string }[] | null;
    attachment_url?: string | null;
    created_at?: string | null;
}

interface Props {
    conversations: Conversation[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Chat', href: '/chat' },
];

export default function ChatPage({ conversations: initialConversations }: Props) {
    const { success, error: showError } = useToast();
    const usingMockData = initialConversations.length === 0;
    const mockNames = [
        'Olivia Johnson', 'Liam Smith', 'Ava Williams', 'Noah Brown', 'Sophia Jones',
        'Ethan Garcia', 'Isabella Miller', 'Mason Davis', 'Mia Rodriguez', 'Logan Martinez',
        'Amelia Hernandez', 'Lucas Lopez', 'Harper Gonzalez', 'Elijah Wilson', 'Evelyn Anderson',
        'James Thomas', 'Abigail Taylor', 'Benjamin Moore', 'Emily Jackson', 'Alexander Martin',
    ];
    const mockConversations: Conversation[] = Array.from({ length: 20 }).map((_, idx) => ({
        id: idx + 1,
        name: mockNames[idx],
        phone_number: `+1 (555) ${String(200 + idx).padStart(3, '0')}-${String(1000 + idx).slice(-4)}`,
    }));

    const mockMessages: Record<number, Message[]> = {
        1: [
            {
                id: 1,
                content: 'Hi, I saw you offer Twilio and automation services. I am interested in sending bulk SMS for my business.',
                is_outgoing: false,
                created_at: '2025-08-07T17:25:32Z',
            },
            {
                id: 2,
                content: 'Hi! Absolutely. We can help with bulk SMS, automated flows, and full CRM integrations. What kind of volume are you expecting?',
                is_outgoing: true,
                created_at: '2025-08-07T17:29:24Z',
            },
            {
                id: 3,
                content: 'Around 5k to 10k texts per month.',
                is_outgoing: false,
                created_at: '2025-08-07T17:29:45Z',
            },
            {
                id: 4,
                content: 'Perfect. With that volume we can optimize deliverability and keep costs low. Do you already have your numbers set up?',
                is_outgoing: true,
                created_at: '2025-08-07T17:31:13Z',
            },
            {
                id: 5,
                content: 'I do not have anything configured yet.',
                is_outgoing: false,
                created_at: '2025-08-07T17:31:13Z',
            },
            {
                id: 6,
                content: 'No problem. We can guide you through the entire process. If you want, I can prepare a proposal with pricing and a kickoff plan.',
                is_outgoing: true,
                created_at: '2025-08-07T17:31:13Z',
            },
        ],
        2: [
            { id: 7, content: 'Is there a discount for teams?', is_outgoing: false, created_at: new Date().toISOString() },
            { id: 8, content: 'Yes—tiered pricing starts at 5 seats. Want me to email the grid?', is_outgoing: true, created_at: new Date().toISOString() },
        ],
        3: [
            { id: 9, content: 'Can it integrate with Slack?', is_outgoing: false, created_at: new Date().toISOString() },
            { id: 10, content: 'It can! I can enable your workspace if you share the org slug.', is_outgoing: true, created_at: new Date().toISOString() },
        ],
    };

    const defaultSelected = usingMockData ? mockConversations[0] : null;

    const [conversations, setConversations] = useState(usingMockData ? mockConversations : initialConversations);
    const [selected, setSelected] = useState<Conversation | null>(defaultSelected);
    const [messages, setMessages] = useState<Message[]>(usingMockData && defaultSelected ? (mockMessages[defaultSelected.id] ?? []) : []);
    const [content, setContent] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [name, setName] = useState('');

    // Listen for incoming messages when a conversation is clicked
    useEffect(() => {
        if (!selected || usingMockData) return;

        const channelName = `conversations.${selected.id}`;
        const channel = echo.private(channelName);

        const handler = (e: { conversation: Conversation, message: Message }) => {
            if (e.conversation.id !== selected.id) return;

            setMessages((prevMessages) => [...prevMessages, e.message]);

            const messageContainer = document.querySelector('.message-container');
            if (messageContainer) {
                messageContainer.scrollTop = messageContainer.scrollHeight;
            }
        };

        channel.listen('.MessageReceived', handler);

        return () => {
            channel.stopListening('MessageReceived');
            echo.leave(channelName);
        };
    }, [selected]);

    const loadMessages = (conversation: Conversation) => {
        setSelected(conversation);
        if (usingMockData) {
            setMessages(mockMessages[conversation.id] ?? [
                { id: Date.now(), content: 'This is a new mock thread. Say hi!', is_outgoing: false, created_at: new Date().toISOString() },
            ]);
            return;
        }

        api.get(`/api/conversations/${conversation.id}`).then((r) => {
            setMessages(r.data.conversation.messages || []);
        });
    };

    const createConversation = () => {
        if (usingMockData) {
            const fallbackName = mockNames[conversations.length % mockNames.length] || `Contact ${conversations.length + 1}`;
            const newConv: Conversation = {
                id: conversations.length + 1,
                phone_number: phoneNumber || `+1555${Math.floor(Math.random() * 900000 + 100000)}`,
                name: name || fallbackName,
            };
            setConversations((c) => [...c, newConv]);
            setPhoneNumber('');
            setName('');
            success('Conversation created (mock)', `New conversation created with ${newConv.name ?? newConv.phone_number}`);
            return;
        }

        api.post('/api/conversations', { phone_number: phoneNumber, name })
            .then((r) => {
                setConversations((c) => [...c, r.data]);
                setPhoneNumber('');
                setName('');
                success('Conversation created', `New conversation created with ${name || phoneNumber}`);
            })
            .catch((error) => {
                showError('Failed to create conversation', error.response?.data?.error || 'An error occurred');
            });
    };

    const sendMessage = () => {
        if (!selected) return;

        if (usingMockData) {
            const nextId = messages.length ? messages[messages.length - 1].id + 1 : 1;
            const newMessage: Message = {
                id: nextId,
                content,
                is_outgoing: true,
                created_at: new Date().toISOString(),
            };
            setMessages((m) => [...m, newMessage]);
            setContent('');
            setAttachment(null);
            success('Message sent (mock)', 'Your message has been added to this mock conversation.');
            return;
        }

        const form = new FormData();
        form.append('content', content);
        if (attachment) {
            form.append('attachment', attachment);
        }
        api
            .post(`/api/conversations/${selected.id}/messages`, form)
            .then((r) => {
                setMessages((m) => [...m, r.data.message]);
                setContent('');
                setAttachment(null);
                success('Message sent', 'Your message has been sent successfully');
            })
            .catch((error) => {
                showError('Failed to send message', error.response?.data?.error || 'An error occurred while sending the message');
            });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Chat" />
            <div className="flex h-full">
                <div className="w-60 border-r space-y-4 p-2">
                    <div className="space-y-2">
                        <input
                            className="w-full border rounded-md p-1"
                            placeholder="Phone number"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                        />
                        <input
                            className="w-full border rounded-md p-1"
                            placeholder="Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <button
                            onClick={createConversation}
                            className="w-full rounded-md bg-primary px-2 py-1 text-primary-foreground"
                        >
                            Create
                        </button>
                    </div>
                    {conversations.map((conv) => (
                        <button
                            key={conv.id}
                            onClick={() => loadMessages(conv)}
                            className={`block w-full p-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 ${selected?.id === conv.id ? 'bg-neutral-200 dark:bg-neutral-700' : ''}`}
                        >
                            <div className="font-medium">
                                {conv.name ?? conv.phone_number}
                            </div>
                            <div className="text-sm text-neutral-500">
                                {conv.phone_number}
                            </div>
                        </button>
                    ))}
                </div>
                <div className="flex-1 flex flex-col">
                    <div className="flex-1 p-4 max-h-[600px] overflow-y-auto space-y-4">
                        {selected &&
                            messages.map((m) => (
                                <Message key={m.id} message={m} />
                            ))}
                    </div>
                    {selected && (
                        <div className="border-t p-4 space-y-2">
                            <textarea
                                className="w-full border rounded-md p-2"
                                rows={3}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                            />
                            <div className="flex justify-between items-baseline">
                                <input
                                    type="file"
                                    className="border rounded-md p-2"
                                    onChange={(e) =>
                                        setAttachment(e.target.files ? e.target.files[0] : null)
                                    }
                                    accept=".pdf,.jpg,.jpeg,.png,video/*"
                                />
                                <div>
                                    <button
                                        onClick={sendMessage}
                                        className="mt-2 rounded-md bg-primary px-4 py-2 text-primary-foreground"
                                    >
                                        Send
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
