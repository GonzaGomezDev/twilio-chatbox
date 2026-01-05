<?php

namespace App\DTO;

class MessageData
{
    public function __construct(
        public int $conversation_id,
        public string $content,
        public ?string $attachment_path,
        public bool $is_outgoing,
    ) {
    }

    public static function create(int $conversation_id, string $content, ?string $attachment_path, bool $is_outgoing = true): self
    {
        return new self($conversation_id, $content, $attachment_path, $is_outgoing);
    }

    public function toArray(): array
    {
        return [
            'conversation_id' => $this->conversation_id,
            'content' => $this->content,
            'attachment_path' => $this->attachment_path,
            'is_outgoing' => $this->is_outgoing,
        ];
    }
}
