<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('campaigns', function (Blueprint $table) {
            if (! Schema::hasColumn('campaigns', 'replied_count')) {
                $table->integer('replied_count')->default(0)->after('failed_count');
            }
        });

        Schema::table('campaign_contacts', function (Blueprint $table) {
            if (! Schema::hasColumn('campaign_contacts', 'replied_at')) {
                $table->timestamp('replied_at')->nullable()->after('sent_at');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('campaigns', function (Blueprint $table) {
            if (Schema::hasColumn('campaigns', 'replied_count')) {
                $table->dropColumn('replied_count');
            }
        });

        Schema::table('campaign_contacts', function (Blueprint $table) {
            if (Schema::hasColumn('campaign_contacts', 'replied_at')) {
                $table->dropColumn('replied_at');
            }
        });
    }
};
