const jwt = require("jsonwebtoken");
require("dotenv").config();
const config = process.env;


const authorisation = (role) => {
    return (req, res, next) => {
        let user = req.signedCookies;
        const xAccessToken = user?.user?.token;
		console.log("Access Token", xAccessToken);
		if (xAccessToken) {
			const decoded = jwt.verify(xAccessToken, config.TOKEN_KEY);
			user = decoded.user.account_type;
			if (convertToRole(user) >= convertToRole(role)) {
				return next();
			}
		}
        console.log("Not authorised.");
		
		return res.status(401).send({
			auth: false,
			message: "You are not authorised to access this page.",
			status: 401,
			payload: null,
		});

    };
};

const convertToRole = (role) => {
    switch (role) {
        case "user":
            return 1;
        case "admin":
            return 2;
        default:
            return 0;
    }
}

module.exports = authorisation;