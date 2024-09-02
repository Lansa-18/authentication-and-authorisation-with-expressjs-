const UserModel = require("../models/UserModel")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const { get_user_id, get_username } = require("../utils/helper")

const login = async (req, res) => {
    try {
        let { username, password } = req.body
        if (!username || !password) {
            return res.status(400).json({ message: "Invalid Request", ok: false, })
        }

        // Check if user exists
        let user = await UserModel.findOne({ where: { username: username } })

        if (!user) {
            return res.status(400).json({ message: "Invalid Credentials", ok: false, })
        }

        // Check if password is correct
        let isMatch = await bcrypt.compare(password, user.password)

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid Credentials", ok: false, })
        }

        // Create JWT token
        const payload = {
            user: {
                id: user.id,
                username: user.username,
                account_type: user.account_type
            }
        }

        const token = jwt.sign(payload, process.env.TOKEN_KEY, { expiresIn: "24h" })

        res.cookie("user", {
            id: user.id,
            username: user.username,
            token: token,
            account_type: user.account_type
        }, { httpOnly: true, signed: true, secure: false, maxAge: 60 * 60 * 24 * 1000 })
        return res.status(200).json({
            ok: true,
            message: "Login Successful",
            is_admin: user.account_type === "admin" ? true : false
        })


    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Server Error" })
    }
}

const logout = async (req, res) => {
    try {
        res.clearCookie("user")
        return res.status(200).json({
            ok: true,
            message: "Logout Successful"
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Server Error" })
    }
}

const register = async (req, res) => {
    try {
        let { username, password, email, contact_number } = req.body
        if (!username || !password || !email || !contact_number) {
            return res.status(400).json({ message: "Invalid Request" })
        }

        // Check if user already exists
        let user = await UserModel.findOne({ where: { username: username } })

        if (user) {
            return res.status(400).json({ message: "User already exists" })
        }

        // Password Hashing
        const salt = await bcrypt.genSalt(10)
        password = await bcrypt.hash(password, salt)

        // Create new user
        user = await UserModel.create({
            username: username,
            password: password,
            email: email,
            contact_number: contact_number,
            salt: salt
        })

        return res.status(200).json({ message: "User Created", ok: true, })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Server Error" })
    }
}

const load_user_profile = async (req, res) => {
    try {
        let user_id = await get_user_id(req) // Get user id from JWT token by the helper function

        if (!user_id) {
            return res.status(400).json({ message: "Invalid Request", ok: false, })
        }



        let user = await UserModel.findOne({
            where: {
                id: user_id
            },
            attributes: { exclude: ['password', 'salt'] }
        }).then((user) => user.dataValues)

        if (!user) {
            return res.status(400).json({ message: "User not found", ok: false, })
        }

        return res.status(200).json({ payload: user, ok: true, })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Server Error" })
    }
}


const update_user_profile = async (req, res) => {
    try {
        let user_id = await get_user_id(req) // Get user id from JWT token by the helper function

        if (!user_id) {
            return res.status(400).json({ message: "Invalid Request", ok: false, })
        }

        let user = await UserModel.findOne({ where: { id: user_id } })

        if (!user) {
            return res.status(400).json({ message: "User not found", ok: false, })
        }

        let { username, email, contact_number } = req.body

        if (username) {
            user.username = username
        }

        if (email) {
            user.email = email
        }

        if (contact_number) {
            user.contact_number = contact_number
        }

        await user.save()

        return res.status(200).json({ message: "User Updated", ok: true, })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Server Error", ok: false, })
    }
}

// Writing the deleteUserProfile functionality. This deletes the user profile.
const delete_user_by_username = async (req, res) => {
    try {
        console.log('Starting delete_user_by_username function');
        
        const {username} = req.body;
        // Get User from username

        let user = await UserModel.findOne({ where: { username: username } })
        if (!user) {
            return res.status(400).json({ message: "User Does not exist" })
        }

        // deleting the User 
        await user.destroy();

        return res.status(200).json({ message: "User deleted successfully" });  
    } catch (error) {
        console.error('Unexpected error in delete_user_by_username:', error);
        return res.status(500).json({ message: "Unexpected Server Error", error: error.message });
    }
};

module.exports = {
    login,
    logout,
    register,
    load_user_profile,
    update_user_profile,
    delete_user_by_username
}