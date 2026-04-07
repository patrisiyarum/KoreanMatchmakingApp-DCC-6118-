import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const PronunciationRating = sequelize.define('PronunciationRating', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'UserProfile', key: 'id' },
      onDelete: 'CASCADE',
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    time: {
      allowNull: false,
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'PronunciationRatings',
    timestamps: false,
  });

  return PronunciationRating;
};
