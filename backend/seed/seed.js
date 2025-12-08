import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Issue from '../src/models/Issue.js';
import Comment from '../src/models/Comment.js';
import connectDB from '../src/utils/db.js';

dotenv.config();

// Demo users
const demoUsers = [
  {
    name: 'Authority User',
    email: 'authority@civicsolve.test',
    passwordHash: 'AuthPass123!',
    role: 'authority'
  },
  {
    name: 'Alice Johnson',
    email: 'alice@civicsolve.test',
    passwordHash: 'UserPass123!',
    role: 'user'
  },
  {
    name: 'Bob Smith',
    email: 'bob@civicsolve.test',
    passwordHash: 'UserPass123!',
    role: 'user'
  },
  {
    name: 'Charlie Brown',
    email: 'charlie@civicsolve.test',
    passwordHash: 'UserPass123!',
    role: 'user'
  }
];

// Sample issue data
const issueTemplates = [
  {
    title: 'Large pothole on Main Street',
    description: 'There is a large pothole near the intersection of Main Street and Oak Avenue. It has been getting worse over the past few weeks and is causing damage to vehicles.',
    category: 'pothole',
    severity: 4
  },
  {
    title: 'Garbage not collected for 2 weeks',
    description: 'The garbage bins on Elm Street have not been collected for over two weeks. The area is starting to smell and attract pests.',
    category: 'garbage',
    severity: 3
  },
  {
    title: 'Water leak on sidewalk',
    description: 'There is a continuous water leak coming from a broken pipe under the sidewalk on Park Avenue. Water is pooling and creating a hazard.',
    category: 'water_leak',
    severity: 5
  },
  {
    title: 'Streetlight out on corner',
    description: 'The streetlight at the corner of 5th Street and Maple Drive has been out for several days. The area is very dark at night.',
    category: 'streetlight',
    severity: 2
  },
  {
    title: 'Traffic signal malfunction',
    description: 'The traffic signal at the intersection of Broadway and 3rd Street is stuck on red. Traffic is backing up significantly.',
    category: 'traffic',
    severity: 5
  },
  {
    title: 'Broken bench in park',
    description: 'One of the benches in Central Park is broken and unsafe to sit on. The wood is splintered and the legs are unstable.',
    category: 'other',
    severity: 2
  },
  {
    title: 'Multiple potholes on Highway 101',
    description: 'There are several potholes along Highway 101 between exits 5 and 7. They are causing traffic issues and potential vehicle damage.',
    category: 'pothole',
    severity: 4
  },
  {
    title: 'Overflowing dumpster',
    description: 'The dumpster behind the shopping center on Commerce Street is overflowing. Garbage is spilling onto the parking lot.',
    category: 'garbage',
    severity: 3
  },
  {
    title: 'Broken fire hydrant',
    description: 'The fire hydrant on Pine Street appears to be leaking. Water is running down the street continuously.',
    category: 'water_leak',
    severity: 4
  },
  {
    title: 'Flickering streetlight',
    description: 'The streetlight on Oak Boulevard is flickering constantly. It is very distracting and may indicate an electrical issue.',
    category: 'streetlight',
    severity: 2
  },
  {
    title: 'Road construction debris',
    description: 'There is leftover construction debris blocking part of the bike lane on Riverside Drive. It has been there for over a week.',
    category: 'traffic',
    severity: 3
  },
  {
    title: 'Graffiti on public building',
    description: 'There is extensive graffiti on the side of the community center. It needs to be cleaned up.',
    category: 'other',
    severity: 1
  },
  {
    title: 'Deep pothole causing flat tires',
    description: 'A very deep pothole on Market Street has caused multiple flat tires. It needs immediate attention.',
    category: 'pothole',
    severity: 5
  },
  {
    title: 'Illegal dumping site',
    description: 'Someone has been dumping large items (furniture, appliances) in the vacant lot on Industrial Avenue. It is becoming an eyesore.',
    category: 'garbage',
    severity: 4
  },
  {
    title: 'Water main break',
    description: 'There appears to be a water main break on 2nd Street. Water is flowing down the street and the area is flooded.',
    category: 'water_leak',
    severity: 5
  },
  {
    title: 'Multiple streetlights out',
    description: 'Three consecutive streetlights are out on Sunset Boulevard, making the area very dark and potentially unsafe.',
    category: 'streetlight',
    severity: 3
  },
  {
    title: 'Road closed sign missing',
    description: 'The road closure signs for the construction on Bridge Street have been removed, but the road is still closed. This is confusing drivers.',
    category: 'traffic',
    severity: 3
  },
  {
    title: 'Damaged playground equipment',
    description: 'One of the swings in the playground at Memorial Park is broken and hanging at an angle. It is unsafe for children.',
    category: 'other',
    severity: 3
  },
  {
    title: 'Sinkhole forming on road',
    description: 'A sinkhole appears to be forming on County Road 12. The road surface is sinking and creating a dangerous condition.',
    category: 'pothole',
    severity: 5
  },
  {
    title: 'Recycling bins not being collected',
    description: 'The recycling bins on Green Street have not been collected for three weeks. They are overflowing.',
    category: 'garbage',
    severity: 2
  }
];

// Bounding box for random locations (example: New York City area)
const BBOX = {
  minLng: -74.1,
  minLat: 40.6,
  maxLng: -73.9,
  maxLat: 40.8
};

// Generate random location within bounding box
function randomLocation() {
  const lng = BBOX.minLng + Math.random() * (BBOX.maxLng - BBOX.minLng);
  const lat = BBOX.minLat + Math.random() * (BBOX.maxLat - BBOX.minLat);
  return { type: 'Point', coordinates: [lng, lat] };
}

// Generate random status with history
function randomStatus(authorId) {
  const statuses = ['reported', 'acknowledged', 'in_progress', 'resolved', 'closed'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const statusIndex = statuses.indexOf(status);
  
  const history = [];
  for (let i = 0; i <= statusIndex; i++) {
    history.push({
      status: statuses[i],
      changedBy: authorId,
      at: new Date(Date.now() - (statusIndex - i) * 24 * 60 * 60 * 1000),
      note: `Status changed to ${statuses[i]}`
    });
  }
  
  return { status, statusHistory: history };
}

async function seed() {
  try {
    console.log('Connecting to database...');
    await connectDB(process.env.MONGO_URI || 'mongodb://localhost:27017/civicsolve');

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Issue.deleteMany({});
    await Comment.deleteMany({});

    // Create users
    console.log('Creating users...');
    const users = [];
    for (const userData of demoUsers) {
      const user = new User(userData);
      await user.save();
      users.push(user);
      console.log(`Created user: ${user.email} (${user.role})`);
    }

    const adminUser = users.find(u => u.role === 'admin');
    const authorityUser = users.find(u => u.role === 'authority');
    const regularUsers = users.filter(u => u.role === 'user');

    // Create issues
    console.log('Creating issues...');
    const issues = [];
    for (let i = 0; i < issueTemplates.length; i++) {
      const template = issueTemplates[i];
      const author = regularUsers[Math.floor(Math.random() * regularUsers.length)];
      const { status, statusHistory } = randomStatus(author._id);
      
      // Random upvotes
      const upvoteCount = Math.floor(Math.random() * 5);
      const upvotes = regularUsers
        .slice(0, upvoteCount)
        .map(u => u._id);

      // Random subscribers
      const subscriberCount = Math.floor(Math.random() * 3);
      const subscribers = regularUsers
        .slice(0, subscriberCount)
        .map(u => u._id);

      const issue = new Issue({
        ...template,
        author: author._id,
        location: randomLocation(),
        status,
        statusHistory,
        upvotes,
        subscribers,
        images: [`/uploads/placeholder-${(i % 5) + 1}.jpg`], // Placeholder images
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
      });

      await issue.save();
      issues.push(issue);
      console.log(`Created issue: ${issue.title}`);
    }

    // Create some comments
    console.log('Creating comments...');
    for (let i = 0; i < 10; i++) {
      const issue = issues[Math.floor(Math.random() * issues.length)];
      const author = users[Math.floor(Math.random() * users.length)];
      
      const comments = [
        'This is a serious issue that needs immediate attention.',
        'I have also noticed this problem. Thanks for reporting!',
        'I hope this gets fixed soon.',
        'This has been an ongoing issue for months.',
        'I will follow up on this.',
        'Great catch! This definitely needs to be addressed.',
        'I have seen similar issues in other areas too.',
        'Thanks for bringing this to attention.',
        'This is affecting many people in the neighborhood.',
        'I agree, this needs urgent attention.'
      ];

      const comment = new Comment({
        issueId: issue._id,
        author: author._id,
        text: comments[Math.floor(Math.random() * comments.length)],
        createdAt: new Date(issue.createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000)
      });

      await comment.save();
      issue.commentsCount += 1;
      await issue.save();
    }

    console.log('\n✅ Seed completed successfully!');
    console.log('\nDemo credentials:');
    console.log('Admin: admin@civicsolve.test / AdminPass123!');
    console.log('Authority: authority@civicsolve.test / AuthPass123!');
    console.log('User: alice@civicsolve.test / UserPass123!');
    console.log(`\nCreated ${users.length} users, ${issues.length} issues, and comments.`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();






