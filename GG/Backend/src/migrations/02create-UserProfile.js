/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('UserProfile', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.INTEGER,
        references: {
            model: 'UserAccount',
            key: 'id'
        }
      },
        native_language: {
            type: Sequelize.STRING
        },
        target_language: {
            type: Sequelize.STRING
        },
        target_language_proficiency: {
            type: Sequelize.STRING
        },
        age: {
            type: Sequelize.INTEGER
        },
        gender: {
            allowNull: true,
            type: Sequelize.STRING
        },
        profession: {
            allowNull: false,
            type: Sequelize.STRING
        },
        hobby: {
            allowNull: true,
            type: Sequelize.STRING
        },
        mbti: {
            allowNull: true,
            type: Sequelize.STRING
        },
        dates_available: {
            allowNull: true,
            type: Sequelize.STRING
        },
        times_available: {
            allowNull: true,
            type: Sequelize.STRING
        },
        visibility: {
            allowNull: true,
            type: Sequelize.STRING
        },
        rating: {                
            allowNull: true,
            type: Sequelize.INTEGER         
        },
        createdAt: {
            allowNull: false,
            type: Sequelize.DATE
        },
        updatedAt: {
            allowNull: false,
            type: Sequelize.DATE
        }});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('UserProfile');
  }
};