<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('chatbot_logs', function (Blueprint $table) {
            $table->integer('response_time_ms')->nullable()->after('reponse');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('chatbot_logs', function (Blueprint $table) {
            $table->dropColumn('response_time_ms');
        });
    }
};
