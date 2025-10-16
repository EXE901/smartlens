


import bcrypt from 'bcrypt';
import knex from 'knex';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const db = knex({
  client: 'pg',
  connection: process.env.DATABASE_URL || 'postgresql://postgres:swivx@127.0.0.1:5432/smart'
});

db.raw('SELECT 1')
.then(() => console.log('✅ Database connected successfully'))
.catch(err => {
  console.error('❌ Database connection failed:', err.message);
  console.error('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Missing');
});

const handleSignin = async (req, res) => {
  try {
    const data = await db.select('email', 'hash').from('login')
      .where('email', '=', req.body.email);
    
    if (!data.length) {
      return res.status(400).json('wrong credentials');
    }

    const isValid = await bcrypt.compare(req.body.password, data[0].hash);
    
    if (isValid) {
      const user = await db.select('*').from('users')
        .where('email', '=', req.body.email);
      res.json(user[0]);
    } else {
      res.status(400).json('wrong credentials');
    }
  } catch (err) {
    res.status(400).json('wrong credentials');
  }
};

const handleRegister = async (req, res) => {
  const { email, name, password } = req.body;

  if (!email || !name || !password) {
    return res.status(400).json('incorrect form submission');
  }

  try {
    const hash = await bcrypt.hash(password, 10);

    await db.transaction(async trx => {
      const loginEmail = await trx('login')
        .returning('email')
        .insert({
          hash: hash,
          email: email
        });

      const user = await trx('users')
        .returning('*')
        .insert({
          email: loginEmail[0].email,
          name: name,
          joined: new Date()
        });

      res.json(user[0]);
    });
  } catch (err) {
    res.status(400).json('unable to register');
  }
};

const handleOAuthLogin = async (req, res) => {
  const { email, name, provider } = req.body;
  
  try {
    let user = await db.select('*').from('users').where({ email });
    
    if (user.length) {
      if (!user[0].provider) {
        await db('users').where({ email }).update({ provider });
        user[0].provider = provider;
      }
      res.json(user[0]);
    } else {
      const newUser = await db('users')
        .returning('*')
        .insert({
          email: email,
          name: name,
          provider: provider,
          joined: new Date()
        });
      
      res.json(newUser[0]);
    }
  } catch (err) {
    console.error('OAuth login error:', err);
    res.status(400).json('OAuth login failed');
  }
};

const handleProfileGet = async (req, res) => {
  const { id } = req.params;
  
  try {
    const user = await db.select('*').from('users').where({ id });
    
    if (user.length) {
      res.json(user[0]);
    } else {
      res.status(404).json('User not found');
    }
  } catch (err) {
    res.status(400).json('Error getting user');
  }
};

const handleProfileUpdate = async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  
  try {
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    const user = await db('users')
      .where({ id })
      .update(updateData)
      .returning('*');

    if (user.length) {
      res.json(user[0]);
    } else {
      res.status(400).json('User not found');
    }
  } catch (err) {
    res.status(400).json('Unable to update profile');
  }
};

const handlePasswordUpdate = async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  
  try {
    const hash = await bcrypt.hash(password, 10);
    
    const userEmail = await db('users').where({ id }).select('email');
    
    if (!userEmail.length) {
      return res.status(400).json('User not found');
    }

    await db('login')
      .where('email', '=', userEmail[0].email)
      .update({ hash });

    res.json('Password updated successfully');
  } catch (err) {
    res.status(400).json('Unable to update password');
  }
};

const handleAccountDelete = async (req, res) => {
  const { id } = req.params;
  
  try {
    await db.transaction(async trx => {
      const user = await trx('users').where({ id }).select('email');
      
      if (!user.length) {
        throw new Error('User not found');
      }
      
      try {
        await trx('login').where('email', '=', user[0].email).del();
      } catch (err) {
        console.log('No login entry found (OAuth user)', err.message);
      }
      
      await trx('users').where({ id }).del();
    });

    res.json('Account deleted successfully');
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(400).json('Unable to delete account: ' + err.message);
  }
};

const handleImage = async (req, res) => {
  const { id } = req.body;
  
  try {
    const entries = await db('users').where('id', '=', id)
      .increment('entries', 1)
      .returning('entries');
    
    res.json(entries[0].entries);
  } catch (err) {
    res.status(400).json('Unable to get entries');
  }
};

const checkAuthType = async (req, res) => {
  const { email } = req.params;
  
  try {
    const loginEntry = await db.select('email').from('login').where({ email });
    
    res.json({ 
      hasPassword: loginEntry.length > 0,
      isOAuthOnly: loginEntry.length === 0,
      email: email 
    });
  } catch (err) {
    console.error('Check auth type error:', err);
    res.status(400).json('Error checking auth type');
  }
};

export { 
  handleSignin, 
  handleRegister, 
  handleProfileGet, 
  handleImage, 
  handleOAuthLogin,
  handleProfileUpdate,
  handlePasswordUpdate,
  handleAccountDelete,
  checkAuthType 
};
