import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class TranscriptUser extends Model {
    static associate(models) {
      TranscriptUser.belongsTo(models.Transcript, { 
        foreignKey: 'transcriptId' 
      });
      TranscriptUser.belongsTo(models.UserAccount, { 
        foreignKey: 'userAccountId' 
      });
    }
  }

  TranscriptUser.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    transcriptId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Transcripts',
        key: 'id'
      }
    },
    userAccountId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'UserAccount',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'TranscriptUser',
    tableName: 'TranscriptUsers',
    indexes: [
      {
        unique: true,
        fields: ['transcriptId', 'userAccountId'],
        name: 'unique_transcript_user'
      }
    ]
  });

  return TranscriptUser;
};

