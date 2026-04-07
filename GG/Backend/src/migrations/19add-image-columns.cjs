'use strict';

// add-image-columns.mjs
// Place in: GG/Backend/src/migrations/
// Run with: npx sequelize-cli db:migrate (from GG/Backend/)

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add profileImage to useraccount
    await queryInterface.addColumn('useraccount', 'profileImage', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
      comment: 'Path to uploaded profile image, relative to /uploads/'
    });

    // Add teamImage to Team (alongside existing emoji logo)
    await queryInterface.addColumn('Team', 'teamImage', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
      comment: 'Path to uploaded team image, relative to /uploads/'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('useraccount', 'profileImage');
    await queryInterface.removeColumn('Team', 'teamImage');
  }
};
