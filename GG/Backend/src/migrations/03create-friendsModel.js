/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('FriendsModel', {
      user1_ID: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.INTEGER,
        references: {
            model: 'UserProfile',
            key: 'id'
        }
      },
       user2_ID: {
          allowNull: false,
          primaryKey: true,
          type: Sequelize.INTEGER,
          references: {
              model: 'UserProfile',
              key: 'id'
          }
       },
    });
  },
  
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('FriendsModel');
  }
};