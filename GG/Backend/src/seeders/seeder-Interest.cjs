'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    const interests = [
      { interest_name: 'Books' },
      { interest_name: 'Music' },
      { interest_name: 'Sports' },
      { interest_name: 'Hiking' },
      { interest_name: 'Video Games' },
      { interest_name: 'Politics' },
      { interest_name: 'Food' },
      { interest_name: 'Movies/TV' },
      { interest_name: 'Fishing' },
      { interest_name: 'Fitness' },
      { interest_name: 'Art/Crafting'},
      { interest_name: 'Travel'},
    ];
    await queryInterface.bulkInsert('Interest', interests, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Interest', null, {});
  }
};