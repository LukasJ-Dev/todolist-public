// MongoDB initialization script for Docker
// This script runs when the MongoDB container starts for the first time

// Switch to the todolist database
db = db.getSiblingDB('todolist');

// Create a user for the application
db.createUser({
  user: 'todolist_user',
  pwd: 'todolist_password',
  roles: [
    {
      role: 'readWrite',
      db: 'todolist',
    },
  ],
});

// Create collections with initial indexes
db.createCollection('users');
db.createCollection('todolists');
db.createCollection('tasks');
db.createCollection('refreshtokens');

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ createdAt: -1 });

db.todolists.createIndex({ owner: 1, createdAt: -1 });
db.todolists.createIndex({ owner: 1, name: 1 }, { unique: true });

db.tasks.createIndex({ owner: 1, todolist: 1 });
db.tasks.createIndex({ owner: 1, createdAt: -1 });

db.refreshtokens.createIndex({ tokenHash: 1 }, { unique: true });
db.refreshtokens.createIndex({ userId: 1 });
db.refreshtokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

print('MongoDB initialization completed successfully!');
