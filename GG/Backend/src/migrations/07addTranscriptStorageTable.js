export async function up(queryInterface, Sequelize) {
  const tablesRaw = await queryInterface.showAllTables();
  const tables = (tablesRaw || []).map((t) => (typeof t === 'string' ? t : t?.tableName || '')).filter(Boolean);
  const hasTable = (name) => tables.some((t) => String(t).toLowerCase() === String(name).toLowerCase());

  // Create Transcripts table
  if (!hasTable('Transcripts')) {
    await queryInterface.createTable('Transcripts', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      sessionId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      transcript: {
        type: Sequelize.TEXT, // Supports large strings
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      aiAccess: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }
    });
  }

  // Create junction table for many-to-many relationship
  if (!hasTable('TranscriptUsers')) {
    await queryInterface.createTable('TranscriptUsers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      transcriptId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Transcripts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      userAccountId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'UserAccount', // Reference to your existing UserAccount table
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  }

  // Add composite unique constraint to prevent duplicate user-transcript pairs
  try {
    await queryInterface.addConstraint('TranscriptUsers', {
      fields: ['transcriptId', 'userAccountId'],
      type: 'unique',
      name: 'unique_transcript_user'
    });
  } catch (err) {
    // Ignore if already exists
    if (err?.original?.code !== 'ER_DUP_KEYNAME' && err?.parent?.code !== 'ER_DUP_KEYNAME') {
      throw err;
    }
  }

  // Add indexes for faster queries
  try { await queryInterface.addIndex('TranscriptUsers', ['transcriptId']); } catch {}
  try { await queryInterface.addIndex('TranscriptUsers', ['userAccountId']); } catch {}
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('TranscriptUsers');
  await queryInterface.dropTable('Transcripts');
}
