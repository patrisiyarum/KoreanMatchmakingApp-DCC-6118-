//import pool from '../config/connectDB';
//import multer from 'multer'

//let getHomePage = async(req, res) => {
//  let data = [];
//  const [rows, fields] = await pool.execute('SELECT * FROM `Users`');
//  return res.render('index.ejs', {dataUser: rows})
//}

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Prefer src/public first (Plesk document root is often GG/Backend/src/public).
// Backend/public is a legacy fallback so uploads to src/public are not shadowed.
const indexCandidates = [
    path.join(__dirname, "../public/index.html"),
    path.join(__dirname, "../../public/index.html"),
];

// import db from '../models/index';
let getHomePage = async (req, res) => {
    try {
        for (const indexHtml of indexCandidates) {
            if (fs.existsSync(indexHtml)) {
                return res.sendFile(indexHtml);
            }
        }
        return res.render("homepage.ejs", {
            data: JSON.stringify([]),
        });
    } catch (e) {
        console.log(e);
    }
};
//let getDetailPage = async (req, res) => {
//  let userId = req.params.id;
//  let [user] = await pool.execute(`select * from users where id = ?`, [userId]);
//  return res.send(JSON.stringify(user))
//}
//let createNewUser = async (req, res) => {
//  console.log('Check request: ', req.body);
//  let { firstName, lastName, email, address } = req.body;
//  await pool.execute('insert into Users(firstName, lastName, email, address) values(?, ?, ?, ?)', [firstName, lastName, email, address]);
//
//  return res.redirect('/')
//
//}
//
//let deleteUser = async (req, res) => {
//  let userId = req.body.userId;
//  await pool.execute('delete from Users where id = ?', [userId])
//  return res.redirect('/')
//}
//
//let getEditPage = async (req, res) => {
//  let id = req.params.id;
//  let [user] = await pool.execute(`Select * from users where id = ?`, [id])
//  console.log(user);
//  return res.render('update.ejs', { dataUser: user[0] });
//}
//
//let postUpdateUser = async (req, res) => {
//  let { firstName, lastName, Email, Address, id } = req.body;
//  await pool.execute('update Users set firstName = ?, lastName= ?, Email = ?, Address= ? WHERE id = ?',
//    [firstName, lastName, Email, Address, id]);
//  return res.redirect('/');
//}
//
//let getUploadFilePage = async (req, res) => {
//  return res.render('uploadFile.ejs')
//}
//
//const upload = multer().single('profile_pic');
//let handleUploadFile = async (req, res) => {
//  // 'profile_pic' is the name of our file input field in the HTML form
//  let upload = multer({ storage: storage, fileFilter: imageFilter }).single('profile_pic');
//  console.log(req.file)
//  upload(req, res, function(err) {
//        // req.file contains information of uploaded file
//        // req.body contains information of text fields, if there were any
//
//        if (req.fileValidationError) {
//            return res.send(req.fileValidationError);
//        }
//        else if (!req.file) {
//            return res.send('Please select an image to upload');
//        }
//        else if (err instanceof multer.MulterError) {
//            return res.send(err);
//        }
//        else if (err) {
//            return res.send(err);
//        }
//        // Display uploaded image for user validation
//        res.send(`You have uploaded this image: <hr/><img src="/image/${req.file.filename}" width="500"><hr /><a href="/upload">Upload another image</a>`);
//    });
//
//}

const homeController = {
    getHomePage : getHomePage
//    , getDetailPage, createNewUser, deleteUser, getEditPage, postUpdateUser, getUploadFilePage, handleUploadFile
};
export default homeController;