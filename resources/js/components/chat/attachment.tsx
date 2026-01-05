interface AttachmentProps {
    attachment_url?: string | null;
};

const getAttachmentType = (url: string): string => {
    const extension = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
        return 'image';
    }

    if (['pdf'].includes(extension || '')) {
        return 'pdf';
    }

    if (['mp4', 'avi', 'mov', 'wmv'].includes(extension || '')) {
        return 'video';
    }

    return 'file';
};

export default function Attachment({ attachment_url }: AttachmentProps) {
    if (!attachment_url) return null;

    const attachmentType = getAttachmentType(attachment_url);

    return (
        <div className="attachment">
            <a href={attachment_url} target="_blank" rel="noopener noreferrer">
                {attachmentType === 'image' && (
                    <img src={attachment_url} alt="Attachment" className="max-w-full h-auto" />
                )}
                {attachmentType === 'pdf' && (
                    <span>PDF Document</span>
                )}
                {attachmentType === 'video' && (
                    <span>Video File</span>
                )}
            </a>
        </div>
    );
}
