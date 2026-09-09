<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddRoleContextToConversationParticipantsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('conversation_participants', function (Blueprint $table) {
            $table->string('role_context', 50)->nullable()->after('is_anonymous')->comment('professeur, directeur, candidat, admin');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('conversation_participants', function (Blueprint $table) {
            $table->dropColumn('role_context');
        });
    }
}
