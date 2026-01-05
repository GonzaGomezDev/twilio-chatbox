<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Campaign extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'message_template',
        'field_mapping',
        'scheduled_at',
        'timezone',
        'status',
        'total_contacts',
        'sent_count',
        'failed_count',
        'replied_count',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'field_mapping' => 'array',
        'scheduled_at' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function contacts(): HasMany
    {
        return $this->hasMany(CampaignContact::class);
    }

    public function getProgressPercentageAttribute(): int
    {
        if ($this->total_contacts === 0) {
            return 0;
        }

        return round(($this->sent_count + $this->failed_count) / $this->total_contacts * 100);
    }

    public function isScheduled(): bool
    {
        return $this->status === 'scheduled' && $this->scheduled_at !== null;
    }

    public function isRunning(): bool
    {
        return $this->status === 'running';
    }

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    public function isFailed(): bool
    {
        return $this->status === 'failed';
    }
}

