import mongoose , {Schema} from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
const userSchema = new Schema({
    userName : {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        index : true
    } ,
    email : {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    } ,
    fullName : {
        type: String,
        required: true,
        trim: true ,
        index : true
    } , 
    avatar : {
        type: String,
       required: true,
    }
    ,
    coverImage : {
        type: String
    } ,
    watchHistory : [{
        type: Schema.Types.ObjectId,
        ref: 'Video'
    }],
    password : {
        type: String,
        required: [true , "Password is required"]
    } , 
    refreshToken : {
        type: String
    }
} , {timestamps : true});

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});


userSchema.methods.isPasswordCorrect = async function (plainPassword) {
    const user = this;
    return await bcrypt.compare(plainPassword , user.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
        {userId : this._id.toString(), userName : this.userName , email : this.email , fullName : this.fullName },
        process.env.ACCESS_TOKEN_SECRET,
        {expiresIn : process.env.ACCESS_TOKEN_EXPIRY}
    );
};

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {userId : this._id.toString()},
        process.env.REFRESH_TOKEN_SECRET,
        {expiresIn : process.env.REFRESH_TOKEN_EXPIRY}
    );
};

const User = mongoose.model('User', userSchema);

export { User };