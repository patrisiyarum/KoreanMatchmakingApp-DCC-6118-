import dashboardService from '../Service/dashboardService.js';

let handleDashBoard = async (req, res) => {
    let id = req.body.id;
    if (!id) {
        return res.status(500).json({
            errorCode: 1,
            message: "Missing ID"
        });
    }

    let userData = await dashboardService.handleUserDashBoard(id);

    return res.status(200).json({
        errorCode: userData.errCode,
        message: userData.errMessage,
        user: userData.user ? userData.user : {}
    });
};

const dashboardController = { handleDashBoard };
export default dashboardController;
