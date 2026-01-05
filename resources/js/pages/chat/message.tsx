import Attachment from "@/components/chat/attachment";

interface MessageProps {
    message: {
        id: number;
        content?: string | null;
        is_outgoing: boolean;
        files?: { url: string; type: string }[] | null;
        created_at?: string | null;
        attachment_path?: string | null;
    };
};

export default function Message({ message }: MessageProps) {
    return (
        <div key={message.id} className={message.is_outgoing ? 'text-right' : ''}>
            <div
                className={
                    'inline-block max-w-xs rounded-xl px-3 py-2 ' +
                    (message.is_outgoing
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-neutral-200 dark:bg-neutral-700')
                }
            >
                {message.files && message.files.map((file, index) => (
                    <Attachment
                        key={index}
                        attachment_url={file.url}
                    />
                ))}
                {message.attachment_path && (
                    <Attachment
                        attachment_url={`storage/${message.attachment_path}`}
                    />
                )}
                {message.content && <p>{message.content}</p>}
            </div>
            {message.created_at && (
                <div className="text-xs text-neutral-500 mt-1">
                    {new Date(message.created_at).toLocaleDateString()} {new Date(message.created_at).toLocaleTimeString()}
                </div>
            )}
        </div>
    );
}
