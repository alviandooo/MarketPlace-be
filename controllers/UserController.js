const users = require("../models/users");
const bcrypt = require("bcrypt");
const { checkSizeUpload, checkExtensionFile } = require("../utils/uploadFile");
const { uploadCloudinary, deleteCloudinary } = require("../utils/cloudinary");

const getAll = async (req, res) => {
  try {
    const data = await users.getAll();
    if (data?.length < 1) {
      throw { statusCode: 400, message: "Data doesnt exist!" };
    }

    res.status(200).json({
      status: true,
      message: "Success",
      total: data?.length,
      data: data,
    });
  } catch (error) {
    res.status(error?.statusCode ?? 500).json({
      status: false,
      message: error?.message ?? error,
      total: 0,
      data: [],
    });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await users.getUserById(id);

    if (data.length < 1) {
      throw { statusCode: 400, message: "Data doesnt exist!" };
    }

    res.status(200).json({
      status: true,
      message: "Success",
      data: data,
    });
  } catch (error) {
    res.status(error?.statusCode ?? 500).json({
      status: false,
      message: error?.message ?? error,
      data: [],
    });
  }
};

// edit users
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone_number,
      store_name,
      password,
      role,
      date_of_birth,
      gender,
    } = req.body;

    // get data users
    const getUser = await users.getUserById(id);

    // if id doesnt exist
    if (getUser.length < 1) {
      throw { statusCode: 400, message: "Data doesnt exist!" };
    }

    // check email is already exist
    if (email) {
      const checkEmail = await users.getUserByEmail({ email });
      if (checkEmail.length > 0) {
        throw { statusCode: 409, message: "Email is already exist!" };
      }
    }

    if (password) {
      // hash password
      const hash = await bcrypt.hash(password, saltRounds);
      if (!hash) {
        throw { statusCode: 400, message: "Authentication is failed!" };
      }
    }

    // deklarasi file image
    let file = req.files?.photo;
    let filename = null;

    // if file upload exist
    if (file) {
      // check size file upload
      const checkSize = checkSizeUpload(file);
      if (!checkSize) {
        throw {
          statusCode: 400,
          message: "File upload is too large! only support < 1 MB",
        };
      }

      // check type extension file upload
      const allowedFile = checkExtensionFile(file);
      if (!allowedFile) {
        throw {
          statusCode: 400,
          message: `File is not support! format file must be image`,
        };
      }

      // upload file
      const uploadFile = await uploadCloudinary(file);
      if (!uploadFile.success) {
        throw { statusCode: 400, message: "Upload file error!" };
      } else {
        filename = uploadFile.urlUpload;
      }

      // delete old file
      if (getUser[0].photo) {
        const deleteFile = await deleteCloudinary(getUser[0].photo);
        if (!deleteFile.success) {
          throw { statusCode: 400, message: "Delete old file error!" };
        }
      }
    }

    // update data users
    const dataUpdate = await users.update({
      id,
      name: name ?? getUser[0].name,
      email: email ?? getUser[0].email,
      phone_number: phone_number ?? getUser[0].phone_number,
      store_name: store_name ?? getUser[0].store_name,
      password: password ? hash : getUser[0].password,
      role: role ?? getUser[0].role,
      photo: filename ?? getUser[0].photo,
      date_of_birth: date_of_birth ?? getUser[0].date_of_birth,
      gender: gender ?? getUser[0].gender,
    });

    // return response
    res.status(200).json({
      status: true,
      message: "Data is successfully updated!",
      data: dataUpdate,
    });
  } catch (error) {
    res.status(error?.statusCode ?? 500).json({
      status: false,
      message: error?.message ?? error,
    });
  }
};

// delete users
const destroy = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await users.getUserById(id);
    if (data.length < 1) {
      throw { statusCode: 400, message: "Data doesnt exist!" };
    }

    if (data.length < 1) {
      throw { statusCode: 400, message: "Data doesnt exist!" };
    } else {
      // delete old photo
      if (data[0]?.photo) {
        const deleteFile = await deleteCloudinary(data[0].photo);
        if (!deleteFile.success) {
          throw { statusCode: 400, message: "Delete old photo error!" };
        }
      }
      // delete data from database
      await users.destroy(id);
    }

    // return response
    res.status(200).json({
      status: true,
      message: "Data successfully deleted!",
    });
  } catch (error) {
    res.status(error?.statusCode ?? 500).json({
      status: false,
      message: error?.message ?? error,
    });
  }
};

module.exports = { getAll, getById, destroy, update };
