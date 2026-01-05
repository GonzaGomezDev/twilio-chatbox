<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Message extends Model
{
    use HasFactory;

    protected $fillable = [
        'conversation_id',
        'content',
        'attachment_path',
        'is_outgoing',
    ];

    protected $appends = ['files'];

    public function getFilesAttribute(): array
    {
        $files = [];
        if ($this->attachment_path) {
            $media = json_decode($this->attachment_path, true);

            if (is_array($media) && array_key_exists('media', $media)) {
                foreach ($media['media'] as $file) {
                    $files[] = $file;
                }
            }
        }

        return $files;
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }
}
