import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class Transcript extends Model {
    static associate(models) {
      // Many-to-many relationship with UserAccount through TranscriptUser
      Transcript.belongsToMany(models.UserAccount, {
        through: models.TranscriptUser,
        foreignKey: 'transcriptId',
        otherKey: 'userAccountId',
        as: 'userAccounts'
      });

      // Direct association to junction table
      Transcript.hasMany(models.TranscriptUser, { 
        foreignKey: 'transcriptId' 
      });
    }
  }

  Transcript.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    sessionId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    transcript: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    aiAccess: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'Transcript',
    tableName: 'Transcripts'
  });

  return Transcript;
};
