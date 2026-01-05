<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CampaignContact extends Model
{
    use HasFactory;

    protected $fillable = [
        'campaign_id',
        'first_name',
        'last_name',
        'phone_number',
        'email',
        'custom_fields',
        'status',
        'sent_at',
        'replied_at',
        'error_message',
    ];

    protected $casts = [
        'custom_fields' => 'array',
        'sent_at' => 'datetime',
        'replied_at' => 'datetime',
    ];

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }

    public function getFullNameAttribute(): string
    {
        $parts = array_filter([$this->first_name, $this->last_name]);
        return implode(' ', $parts) ?: $this->phone_number;
    }
}

