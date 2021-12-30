import { Schema, model, Model, Document } from 'mongoose';
import { Password } from '../services/password';

// An interface that describes the properties
// that are required to create a new user
interface UserAttrs{
    email: string,
    password: string
}

// An interface that describes the properties 
// that a User Model has
interface UserModel extends Model<UserDoc>{
    build(attrs: UserAttrs): UserDoc
}

// An interface that describe the properties that a 
// User Document has. Here you can include createdAt and UpdatedAt fields
interface UserDoc extends Document{
    email: string;
    password: string;
}

const userSchema = new Schema({
    email:{
        type: String,
        required: true
    },
    password:{
        type: String,
        required: true
    }
}, {
    toJSON:{
        transform(doc, ret){
            ret.id = ret._id;
            delete ret._id;
            delete ret.password;
            delete ret.__v;
        }
    }
})

userSchema.pre('save', async function(done){
    if(this.isModified('password')){                 // Mongoose considera al password modificado, asi se esté creando el usuaio por primera vez
        const hashed = await Password.toHash(this.get('password'));
        this.set('password', hashed)
    }
    done();
})

userSchema.statics.build = (attrs: UserAttrs) => new User(attrs);

const User = model<UserDoc, UserModel>('User', userSchema);

export { User }