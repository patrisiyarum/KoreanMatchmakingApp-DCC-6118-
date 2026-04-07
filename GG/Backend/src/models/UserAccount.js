import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class UserAccount extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      
    }
  };
  UserAccount.init({
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    loggedIn: DataTypes.BOOLEAN,
    xp: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    gameStats: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    profileImage: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
  }, {
    sequelize,
    modelName: 'UserAccount',
    // DB table is lowercase; Linux/MariaDB is case-sensitive — must match imports/schema.
    tableName: 'useraccount',
  });

  return UserAccount;
};

export const addUserAccountAssociations = (models) => {
  models.UserAccount.belongsToMany(models.Transcript, {
    through: models.TranscriptUser,
    foreignKey: 'userAccountId',
    otherKey: 'transcriptId',
    as: 'transcripts'
  });

  models.UserAccount.hasMany(models.TranscriptUser, { 
    foreignKey: 'userAccountId' 
  });
};
