import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || '*',
  methods: ['GET', 'POST'],
}));
app.use(express.json());
app.use(rateLimit({ windowMs: 60_000, max: 100, message: { error: 'Too many requests.' } }));

// ── HEALTH (keep-alive for Render free tier via UptimeRobot) ──────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
app.get('/', (_req, res) => res.json({ status: 'Kerala Career Compass API ✅' }));

// ── MONGOOSE SCHEMA ───────────────────────────────────────────────────────────
const courseSchema = new mongoose.Schema({
  name:  String,
  seats: { type: Number, default: 0 },
  field: String,
}, { _id: false });

const feeSchema = new mongoose.Schema({
  semester: { type: Number, default: 0 },
  bus:      { type: Number, default: 0 },
  hostel:   { type: Number, default: 0 },
  food:     { type: Number, default: 0 },
}, { _id: false });

const collegeSchema = new mongoose.Schema({
  name:                 { type: String, required: true },
  short:                String,
  district:             { type: String, index: true },
  type:                 { type: String, enum: ['Government', 'Aided', 'Self-financing'] },
  naac:                 { type: String, enum: ['A+', 'A', 'B+', 'B', 'C', 'Not accredited'], default: 'Not accredited' },
  affiliation:          String,
  website:              String,
  courses:              [courseSchema],
  fees:                 { type: feeSchema, default: () => ({}) },
  management_quota_fee: { type: Number, default: 0 },
  rating:               { type: Number, default: 0, min: 0, max: 5 },
  established:          Number,
  image_field:          { type: String, default: 'engineering' },
  reports:              [{ message: String, createdAt: { type: Date, default: Date.now } }],
}, { timestamps: true });

collegeSchema.index({ name: 'text', short: 'text' });
const College = mongoose.model('College', collegeSchema);

// ── SEED DATA — all 14 Kerala districts, all field types ──────────────────────
const SEED = [
  // KASARAGOD
  { name:'LBS College of Engineering', short:'LBS Kasaragod', district:'Kasaragod', type:'Self-financing', naac:'B+', affiliation:'APJ KTU', website:'https://lbscek.ac.in', courses:[{name:'B.Tech CSE',seats:60,field:'engineering'},{name:'B.Tech ECE',seats:60,field:'engineering'}], fees:{semester:45000,bus:3000,hostel:20000,food:24000}, management_quota_fee:150000, rating:3.8, established:2002, image_field:'engineering' },
  { name:'Malik Deenar College of Pharmacy', short:'Malik Deenar Pharmacy', district:'Kasaragod', type:'Self-financing', naac:'B', affiliation:'Kerala University of Health Sciences', website:'https://malikdeenarcollege.com', courses:[{name:'B.Pharm',seats:60,field:'pharmacy'},{name:'D.Pharm',seats:30,field:'pharmacy'}], fees:{semester:40000,bus:2000,hostel:18000,food:20000}, management_quota_fee:0, rating:3.6, established:2005, image_field:'pharmacy' },
  { name:'Sa-Adiya Arts & Science College', short:'Sa-Adiya Arts', district:'Kasaragod', type:'Self-financing', naac:'B', affiliation:'Kannur University', website:'https://saadiyacollege.ac.in', courses:[{name:'BA English',seats:40,field:'arts'},{name:'B.Com',seats:48,field:'commerce'}], fees:{semester:8000,bus:2000,hostel:14000,food:18000}, management_quota_fee:0, rating:3.5, established:2001, image_field:'arts' },

  // KANNUR
  { name:'Vimal Jyothi Engineering College', short:'Vimal Jyothi', district:'Kannur', type:'Self-financing', naac:'A', affiliation:'APJ KTU', website:'https://vjec.ac.in', courses:[{name:'B.Tech CSE',seats:120,field:'engineering'},{name:'B.Tech Civil',seats:60,field:'engineering'},{name:'B.Tech EEE',seats:60,field:'engineering'}], fees:{semester:38000,bus:3500,hostel:22000,food:25000}, management_quota_fee:120000, rating:4.2, established:2001, image_field:'engineering' },
  { name:'Kannur Medical College', short:'KMC Kannur', district:'Kannur', type:'Self-financing', naac:'B+', affiliation:'Kerala University of Health Sciences', website:'https://kannurmedicalcollege.org', courses:[{name:'MBBS',seats:100,field:'medical'},{name:'B.Sc Nursing',seats:60,field:'medical'}], fees:{semester:350000,bus:0,hostel:30000,food:30000}, management_quota_fee:0, rating:3.9, established:2007, image_field:'medical' },
  { name:'Don Bosco Arts & Science College', short:'Don Bosco Kannur', district:'Kannur', type:'Aided', naac:'A', affiliation:'Kannur University', website:'https://donboscokannur.ac.in', courses:[{name:'BA English',seats:48,field:'arts'},{name:'B.Sc Maths',seats:40,field:'arts'},{name:'B.Com',seats:48,field:'commerce'}], fees:{semester:6000,bus:2500,hostel:15000,food:19000}, management_quota_fee:0, rating:4.0, established:1965, image_field:'arts' },

  // KOZHIKODE
  { name:'Government Medical College Kozhikode', short:'GMC Kozhikode', district:'Kozhikode', type:'Government', naac:'A', affiliation:'Kerala University of Health Sciences', website:'https://gmckozhikode.ac.in', courses:[{name:'MBBS',seats:150,field:'medical'},{name:'BDS',seats:40,field:'medical'}], fees:{semester:6500,bus:0,hostel:12000,food:20000}, management_quota_fee:0, rating:4.9, established:1957, image_field:'medical' },
  { name:'KMCT College of Engineering', short:'KMCT Engg', district:'Kozhikode', type:'Self-financing', naac:'B+', affiliation:'APJ KTU', website:'https://kmct.edu.in', courses:[{name:'B.Tech CSE',seats:120,field:'engineering'},{name:'B.Tech Mechanical',seats:60,field:'engineering'}], fees:{semester:42000,bus:3000,hostel:19000,food:22000}, management_quota_fee:130000, rating:3.7, established:2002, image_field:'engineering' },
  { name:'National College of Pharmacy', short:'NCP Kozhikode', district:'Kozhikode', type:'Aided', naac:'A', affiliation:'Kerala University of Health Sciences', website:'https://nationalcollegeofpharmacy.com', courses:[{name:'B.Pharm',seats:60,field:'pharmacy'},{name:'Pharm D',seats:30,field:'pharmacy'}], fees:{semester:20000,bus:2000,hostel:15000,food:18000}, management_quota_fee:0, rating:4.3, established:1972, image_field:'pharmacy' },
  { name:'Dayapuram Arts and Science College', short:'Dayapuram Arts', district:'Kozhikode', type:'Self-financing', naac:'B', affiliation:'Calicut University', website:'https://dayapuramcollege.com', courses:[{name:'BA Economics',seats:40,field:'arts'},{name:'B.Com',seats:48,field:'commerce'},{name:'BA Political Science',seats:40,field:'arts'}], fees:{semester:7000,bus:2000,hostel:13000,food:17000}, management_quota_fee:0, rating:3.4, established:2003, image_field:'arts' },

  // MALAPPURAM
  { name:'MEA Engineering College', short:'MEA Engineering', district:'Malappuram', type:'Self-financing', naac:'B+', affiliation:'APJ KTU', website:'https://meaec.edu.in', courses:[{name:'B.Tech CSE',seats:120,field:'engineering'},{name:'B.Tech ECE',seats:60,field:'engineering'},{name:'B.Tech Civil',seats:60,field:'engineering'}], fees:{semester:40000,bus:3000,hostel:20000,food:23000}, management_quota_fee:120000, rating:3.8, established:2003, image_field:'engineering' },
  { name:'Al Shifa College of Pharmacy', short:'Al Shifa Pharmacy', district:'Malappuram', type:'Self-financing', naac:'A', affiliation:'Kerala University of Health Sciences', website:'https://alshifacollege.com', courses:[{name:'B.Pharm',seats:100,field:'pharmacy'},{name:'Pharm D',seats:60,field:'pharmacy'}], fees:{semester:45000,bus:3000,hostel:20000,food:22000}, management_quota_fee:0, rating:4.1, established:1997, image_field:'pharmacy' },
  { name:'MES Medical College', short:'MES Medical', district:'Malappuram', type:'Self-financing', naac:'A', affiliation:'Kerala University of Health Sciences', website:'https://mesmedicalcollege.com', courses:[{name:'MBBS',seats:100,field:'medical'},{name:'BDS',seats:40,field:'medical'}], fees:{semester:400000,bus:0,hostel:35000,food:32000}, management_quota_fee:0, rating:4.0, established:1997, image_field:'medical' },
  { name:'Markaz Law College', short:'Markaz Law', district:'Malappuram', type:'Self-financing', naac:'B', affiliation:'Calicut University', website:'https://markazlawcollege.com', courses:[{name:'BA LLB',seats:60,field:'law'},{name:'BBA LLB',seats:60,field:'law'}], fees:{semester:25000,bus:2500,hostel:16000,food:19000}, management_quota_fee:0, rating:3.5, established:2006, image_field:'law' },

  // PALAKKAD
  { name:'NSS College of Engineering', short:'NSS Palakkad', district:'Palakkad', type:'Government', naac:'A', affiliation:'APJ KTU', website:'https://nssce.ac.in', courses:[{name:'B.Tech CSE',seats:60,field:'engineering'},{name:'B.Tech Mechanical',seats:60,field:'engineering'},{name:'B.Tech EEE',seats:60,field:'engineering'}], fees:{semester:5000,bus:2000,hostel:16000,food:20000}, management_quota_fee:0, rating:4.4, established:1960, image_field:'engineering' },
  { name:'Ahalia School of Pharmacy', short:'Ahalia Pharmacy', district:'Palakkad', type:'Self-financing', naac:'B+', affiliation:'Kerala University of Health Sciences', website:'https://ahaliapharmacy.com', courses:[{name:'B.Pharm',seats:60,field:'pharmacy'}], fees:{semester:35000,bus:2500,hostel:18000,food:20000}, management_quota_fee:0, rating:3.7, established:2004, image_field:'pharmacy' },
  { name:'Karuna Medical College', short:'Karuna Medical', district:'Palakkad', type:'Self-financing', naac:'B+', affiliation:'Kerala University of Health Sciences', website:'https://karunamedicalcollege.com', courses:[{name:'MBBS',seats:100,field:'medical'},{name:'B.Sc Nursing',seats:60,field:'medical'}], fees:{semester:380000,bus:0,hostel:30000,food:30000}, management_quota_fee:0, rating:3.8, established:2009, image_field:'medical' },

  // THRISSUR
  { name:'Nehru College of Engineering', short:'Nehru Engg Thrissur', district:'Thrissur', type:'Self-financing', naac:'A', affiliation:'APJ KTU', website:'https://ncet.info', courses:[{name:'B.Tech CSE',seats:120,field:'engineering'},{name:'B.Tech Mechanical',seats:60,field:'engineering'},{name:'B.Tech Civil',seats:60,field:'engineering'}], fees:{semester:42000,bus:3000,hostel:21000,food:24000}, management_quota_fee:125000, rating:4.0, established:1995, image_field:'engineering' },
  { name:'Jubilee Mission Medical College', short:'Jubilee Medical', district:'Thrissur', type:'Self-financing', naac:'A', affiliation:'Kerala University of Health Sciences', website:'https://jubileemissionmedicalcollege.in', courses:[{name:'MBBS',seats:100,field:'medical'},{name:'BDS',seats:40,field:'medical'}], fees:{semester:350000,bus:0,hostel:28000,food:28000}, management_quota_fee:0, rating:4.2, established:2012, image_field:'medical' },
  { name:'Nehru Academy of Law', short:'Nehru Law', district:'Thrissur', type:'Self-financing', naac:'B', affiliation:'Mahatma Gandhi University', website:'https://nehruacademyoflaw.com', courses:[{name:'BA LLB',seats:60,field:'law'},{name:'LLB',seats:40,field:'law'}], fees:{semester:22000,bus:2000,hostel:14000,food:17000}, management_quota_fee:0, rating:3.6, established:2006, image_field:'law' },
  { name:'Kerala Agricultural University', short:'KAU Thrissur', district:'Thrissur', type:'Government', naac:'A', affiliation:'Kerala Agricultural University', website:'https://kau.in', courses:[{name:'B.Sc Agriculture',seats:80,field:'agriculture'},{name:'B.Sc Horticulture',seats:40,field:'agriculture'}], fees:{semester:3500,bus:1200,hostel:12000,food:17000}, management_quota_fee:0, rating:4.4, established:1971, image_field:'agriculture' },

  // ERNAKULAM
  { name:'Rajagiri School of Engineering & Technology', short:'Rajagiri Engg', district:'Ernakulam', type:'Self-financing', naac:'A+', affiliation:'APJ KTU', website:'https://rajagiritech.ac.in', courses:[{name:'B.Tech CSE',seats:180,field:'engineering'},{name:'B.Tech IT',seats:60,field:'engineering'},{name:'B.Tech ECE',seats:120,field:'engineering'}], fees:{semester:55000,bus:4000,hostel:26000,food:28000}, management_quota_fee:175000, rating:4.5, established:1995, image_field:'engineering' },
  { name:'Amrita Institute of Medical Sciences', short:'AIMS Kochi', district:'Ernakulam', type:'Self-financing', naac:'A+', affiliation:'Amrita Vishwa Vidyapeetham', website:'https://aims.amrita.edu', courses:[{name:'MBBS',seats:150,field:'medical'},{name:'BDS',seats:60,field:'medical'}], fees:{semester:500000,bus:0,hostel:40000,food:35000}, management_quota_fee:0, rating:4.7, established:1998, image_field:'medical' },
  { name:'CUSAT School of Engineering', short:'CUSAT', district:'Ernakulam', type:'Government', naac:'A', affiliation:'Cochin University of Science and Technology', website:'https://cusat.ac.in', courses:[{name:'B.Tech CSE',seats:90,field:'engineering'},{name:'B.Tech IT',seats:60,field:'engineering'},{name:'B.Tech Mechanical',seats:60,field:'engineering'}], fees:{semester:5100,bus:2000,hostel:16000,food:21000}, management_quota_fee:85000, rating:4.6, established:1971, image_field:'engineering' },
  { name:'Bharat Mata School of Legal Studies', short:'Bharat Mata Law', district:'Ernakulam', type:'Self-financing', naac:'B+', affiliation:'Mahatma Gandhi University', website:'https://bmsls.com', courses:[{name:'BA LLB',seats:60,field:'law'},{name:'BBA LLB',seats:60,field:'law'}], fees:{semester:30000,bus:3000,hostel:18000,food:20000}, management_quota_fee:0, rating:3.7, established:2005, image_field:'law' },
  { name:'Rajagiri College of Social Sciences', short:'Rajagiri Arts', district:'Ernakulam', type:'Aided', naac:'A+', affiliation:'Mahatma Gandhi University', website:'https://rajagiri.edu', courses:[{name:'B.Com',seats:48,field:'commerce'},{name:'BA Sociology',seats:40,field:'arts'},{name:'BBA',seats:36,field:'commerce'}], fees:{semester:8000,bus:2500,hostel:18000,food:20000}, management_quota_fee:0, rating:4.3, established:1955, image_field:'arts' },

  // KOTTAYAM
  { name:'Amal Jyothi College of Engineering', short:'Amal Jyothi', district:'Kottayam', type:'Self-financing', naac:'A', affiliation:'APJ KTU', website:'https://amaljyothi.ac.in', courses:[{name:'B.Tech CSE',seats:120,field:'engineering'},{name:'B.Tech Mechanical',seats:60,field:'engineering'},{name:'B.Tech Civil',seats:60,field:'engineering'}], fees:{semester:45000,bus:3500,hostel:22000,food:25000}, management_quota_fee:140000, rating:4.1, established:1999, image_field:'engineering' },
  { name:'Believers Church Medical College', short:'Believers Medical', district:'Kottayam', type:'Self-financing', naac:'B+', affiliation:'Kerala University of Health Sciences', website:'https://believerschurch.in/medical', courses:[{name:'MBBS',seats:100,field:'medical'}], fees:{semester:420000,bus:0,hostel:32000,food:30000}, management_quota_fee:0, rating:4.0, established:2009, image_field:'medical' },
  { name:'Pushpagiri College of Pharmacy', short:'Pushpagiri Pharmacy', district:'Kottayam', type:'Self-financing', naac:'A', affiliation:'Kerala University of Health Sciences', website:'https://pushpagiripharmacy.com', courses:[{name:'B.Pharm',seats:60,field:'pharmacy'},{name:'M.Pharm',seats:15,field:'pharmacy'}], fees:{semester:38000,bus:2500,hostel:18000,food:20000}, management_quota_fee:0, rating:4.0, established:2001, image_field:'pharmacy' },
  { name:'CSI Institute of Legal Studies', short:'CSI Law', district:'Kottayam', type:'Aided', naac:'B+', affiliation:'Mahatma Gandhi University', website:'https://csilaw.org', courses:[{name:'BA LLB',seats:60,field:'law'},{name:'LLB',seats:40,field:'law'}], fees:{semester:15000,bus:2000,hostel:13000,food:16000}, management_quota_fee:0, rating:3.8, established:1980, image_field:'law' },

  // ALAPPUZHA
  { name:'KVM College of Engineering', short:'KVM Engineering', district:'Alappuzha', type:'Self-financing', naac:'B+', affiliation:'APJ KTU', website:'https://kvmcek.ac.in', courses:[{name:'B.Tech CSE',seats:60,field:'engineering'},{name:'B.Tech Mechanical',seats:60,field:'engineering'}], fees:{semester:38000,bus:2500,hostel:18000,food:21000}, management_quota_fee:110000, rating:3.7, established:2002, image_field:'engineering' },
  { name:'Sree Narayana College of Nursing', short:'SN Nursing Alappuzha', district:'Alappuzha', type:'Self-financing', naac:'B', affiliation:'Kerala University of Health Sciences', website:'https://sncollegeofnursing.com', courses:[{name:'B.Sc Nursing',seats:60,field:'medical'},{name:'GNM',seats:40,field:'medical'}], fees:{semester:45000,bus:2000,hostel:18000,food:20000}, management_quota_fee:0, rating:3.6, established:2006, image_field:'medical' },

  // IDUKKI
  { name:'Marian Engineering College', short:'Marian Engg', district:'Idukki', type:'Self-financing', naac:'A', affiliation:'APJ KTU', website:'https://mariancollege.org', courses:[{name:'B.Tech CSE',seats:120,field:'engineering'},{name:'B.Tech Civil',seats:60,field:'engineering'}], fees:{semester:42000,bus:3000,hostel:20000,food:23000}, management_quota_fee:130000, rating:4.0, established:2000, image_field:'engineering' },
  { name:'Al-Azhar Medical College', short:'Al-Azhar Medical', district:'Idukki', type:'Self-financing', naac:'B+', affiliation:'Kerala University of Health Sciences', website:'https://alazharmedical.com', courses:[{name:'MBBS',seats:100,field:'medical'},{name:'B.Sc Nursing',seats:60,field:'medical'}], fees:{semester:380000,bus:0,hostel:28000,food:28000}, management_quota_fee:0, rating:3.8, established:2008, image_field:'medical' },

  // PATHANAMTHITTA
  { name:'Mount Zion College of Engineering', short:'Mount Zion Engg', district:'Pathanamthitta', type:'Self-financing', naac:'B+', affiliation:'APJ KTU', website:'https://mountzioncollege.com', courses:[{name:'B.Tech CSE',seats:60,field:'engineering'},{name:'B.Tech Civil',seats:60,field:'engineering'}], fees:{semester:40000,bus:3000,hostel:19000,food:22000}, management_quota_fee:115000, rating:3.8, established:2001, image_field:'engineering' },
  { name:'Pushpagiri Medical College', short:'Pushpagiri Medical', district:'Pathanamthitta', type:'Self-financing', naac:'A', affiliation:'Kerala University of Health Sciences', website:'https://pushpagirimedical.com', courses:[{name:'MBBS',seats:100,field:'medical'},{name:'BDS',seats:40,field:'medical'}], fees:{semester:430000,bus:0,hostel:32000,food:30000}, management_quota_fee:0, rating:4.1, established:2002, image_field:'medical' },
  { name:'Mount Zion Law College', short:'Mount Zion Law', district:'Pathanamthitta', type:'Self-financing', naac:'B', affiliation:'Mahatma Gandhi University', website:'https://mountzionlaw.com', courses:[{name:'BA LLB',seats:60,field:'law'},{name:'LLB',seats:40,field:'law'}], fees:{semester:20000,bus:2000,hostel:14000,food:17000}, management_quota_fee:0, rating:3.5, established:2007, image_field:'law' },

  // KOLLAM
  { name:'TKM Institute of Technology', short:'TKM Tech', district:'Kollam', type:'Self-financing', naac:'A', affiliation:'APJ KTU', website:'https://tkm.edu.in', courses:[{name:'B.Tech CSE',seats:120,field:'engineering'},{name:'B.Tech Mechanical',seats:60,field:'engineering'},{name:'B.Tech Civil',seats:60,field:'engineering'}], fees:{semester:44000,bus:3000,hostel:21000,food:24000}, management_quota_fee:135000, rating:4.1, established:1999, image_field:'engineering' },
  { name:'Azeezia Medical College', short:'Azeezia Medical', district:'Kollam', type:'Self-financing', naac:'B+', affiliation:'Kerala University of Health Sciences', website:'https://azeeziamedical.com', courses:[{name:'MBBS',seats:100,field:'medical'},{name:'B.Sc Nursing',seats:60,field:'medical'}], fees:{semester:360000,bus:0,hostel:29000,food:29000}, management_quota_fee:0, rating:3.9, established:2010, image_field:'medical' },
  { name:'SN Trust Law College', short:'SN Law Kollam', district:'Kollam', type:'Aided', naac:'B+', affiliation:'Kerala University', website:'https://snlawcollege.com', courses:[{name:'BA LLB',seats:60,field:'law'},{name:'LLB',seats:40,field:'law'}], fees:{semester:14000,bus:2000,hostel:13000,food:16000}, management_quota_fee:0, rating:3.7, established:1979, image_field:'law' },

  // THIRUVANANTHAPURAM
  { name:'College of Engineering Trivandrum', short:'CET Trivandrum', district:'Thiruvananthapuram', type:'Government', naac:'A+', affiliation:'APJ Abdul Kalam Technological University', website:'https://cet.ac.in', courses:[{name:'B.Tech Computer Science',seats:60,field:'engineering'},{name:'B.Tech Electronics',seats:60,field:'engineering'},{name:'B.Tech Civil',seats:30,field:'engineering'}], fees:{semester:4200,bus:1800,hostel:18000,food:22000}, management_quota_fee:75000, rating:4.8, established:1939, image_field:'engineering' },
  { name:'Mar Ivanios College', short:'Mar Ivanios', district:'Thiruvananthapuram', type:'Aided', naac:'A+', affiliation:'University of Kerala', website:'https://mariv.ac.in', courses:[{name:'B.Com Finance',seats:48,field:'commerce'},{name:'BBA',seats:36,field:'commerce'},{name:'BA Economics',seats:40,field:'arts'},{name:'B.Sc Computer Science',seats:32,field:'engineering'}], fees:{semester:3800,bus:2200,hostel:14000,food:18000}, management_quota_fee:0, rating:4.5, established:1949, image_field:'arts' },
  { name:'Sree Gokulam Medical College', short:'Gokulam Medical', district:'Thiruvananthapuram', type:'Self-financing', naac:'B+', affiliation:'Kerala University of Health Sciences', website:'https://sreegokulammc.com', courses:[{name:'MBBS',seats:100,field:'medical'},{name:'BDS',seats:40,field:'medical'}], fees:{semester:390000,bus:0,hostel:30000,food:30000}, management_quota_fee:0, rating:3.9, established:2007, image_field:'medical' },
  { name:'Government Law College Trivandrum', short:'GLC Trivandrum', district:'Thiruvananthapuram', type:'Government', naac:'A', affiliation:'Kerala University', website:'https://glctvm.ac.in', courses:[{name:'BA LLB',seats:60,field:'law'},{name:'LLB',seats:40,field:'law'}], fees:{semester:3000,bus:1500,hostel:10000,food:15000}, management_quota_fee:0, rating:4.5, established:1903, image_field:'law' },
  { name:'Ezhuthachan College of Pharmacy', short:'Ezhuthachan Pharmacy', district:'Thiruvananthapuram', type:'Self-financing', naac:'B+', affiliation:'Kerala University of Health Sciences', website:'https://ezhuthachanpharmacy.com', courses:[{name:'B.Pharm',seats:60,field:'pharmacy'},{name:'Pharm D',seats:30,field:'pharmacy'}], fees:{semester:32000,bus:2000,hostel:16000,food:18000}, management_quota_fee:0, rating:3.8, established:2005, image_field:'pharmacy' },

  // WAYANAD
  { name:'DM Wayanad Institute of Medical Sciences', short:'DM WIMS', district:'Wayanad', type:'Self-financing', naac:'B+', affiliation:'Kerala University of Health Sciences', website:'https://dmwims.com', courses:[{name:'MBBS',seats:100,field:'medical'},{name:'B.Sc Nursing',seats:60,field:'medical'}], fees:{semester:370000,bus:0,hostel:28000,food:28000}, management_quota_fee:0, rating:3.9, established:2010, image_field:'medical' },
  { name:'Oriental Institute of Technology', short:'OIT Wayanad', district:'Wayanad', type:'Self-financing', naac:'B', affiliation:'APJ KTU', website:'https://orientalwayanad.com', courses:[{name:'B.Tech CSE',seats:60,field:'engineering'},{name:'B.Tech ECE',seats:60,field:'engineering'}], fees:{semester:36000,bus:2500,hostel:17000,food:20000}, management_quota_fee:100000, rating:3.5, established:2010, image_field:'engineering' },
  { name:'Grace College of Pharmacy Wayanad', short:'Grace Pharmacy', district:'Wayanad', type:'Self-financing', naac:'B', affiliation:'Kerala University of Health Sciences', website:'https://gracepharmacywayanad.com', courses:[{name:'B.Pharm',seats:60,field:'pharmacy'}], fees:{semester:30000,bus:2000,hostel:16000,food:19000}, management_quota_fee:0, rating:3.4, established:2007, image_field:'pharmacy' },
];

async function seedIfEmpty() {
  const count = await College.countDocuments();
  if (count === 0) {
    await College.insertMany(SEED);
    console.log(`✅ Auto-seeded ${SEED.length} colleges`);
  }
}

// ── ROADMAP DATA ──────────────────────────────────────────────────────────────
const ROADMAP_PATHS = {
  'sslc-engineering': [
    { id:'path-a', label:'Science Stream Path', tag:'Most Common', tagColor:'brand', total_years:'6 years', total_cost:'₹3–12 lakhs', steps:[
      {label:'SSLC',type:'done',years:'',cost:'',note:'Your current level'},
      {label:'Plus Two (Science/PCM)',type:'next',years:'2 years',cost:'₹15–40k',note:'Physics, Chemistry, Maths — must for engineering'},
      {label:'KEAM / JEE Entrance',type:'exam',years:'',cost:'',note:'Kerala Engineering Entrance + JEE Mains'},
      {label:'B.Tech CSE / ECE / Civil',type:'goal',years:'4 years',cost:'₹20k–3L/yr',note:'Govt: ₹20k/yr · Self-financing: up to ₹3L/yr'},
    ]},
    { id:'path-b', label:'Diploma Lateral Entry', tag:'Technical Focus', tagColor:'gold', total_years:'6 years', total_cost:'₹2–5 lakhs', steps:[
      {label:'SSLC',type:'done',years:'',cost:'',note:'Your current level'},
      {label:'Diploma in Engineering',type:'next',years:'3 years',cost:'₹10–25k',note:'Polytechnic college — less expensive'},
      {label:'Lateral Entry Exam (LET)',type:'exam',years:'',cost:'',note:'Direct admission to 2nd year B.Tech'},
      {label:'B.Tech (2nd Year Entry)',type:'goal',years:'3 years',cost:'₹20k–3L/yr',note:'Save 1 full year compared to direct route'},
    ]},
  ],
  'sslc-medical': [
    { id:'path-a', label:'MBBS Route', tag:'Most Pursued', tagColor:'brand', total_years:'7.5 years', total_cost:'₹5–80 lakhs', steps:[
      {label:'SSLC',type:'done',years:'',cost:'',note:'Your current level'},
      {label:'Plus Two (Bio Science/PCB)',type:'next',years:'2 years',cost:'₹15–40k',note:'Physics, Chemistry, Biology — mandatory'},
      {label:'NEET Entrance',type:'exam',years:'',cost:'',note:'National Medical Entrance — score 550+ for Govt seat'},
      {label:'MBBS',type:'goal',years:'5.5 years',cost:'₹65k–15L/yr',note:'Govt: ₹65k/yr · Private: up to ₹15L/yr'},
    ]},
    { id:'path-b', label:'Nursing / Paramedical', tag:'Faster Entry', tagColor:'gold', total_years:'5 years', total_cost:'₹2–5 lakhs', steps:[
      {label:'SSLC',type:'done',years:'',cost:'',note:'Your current level'},
      {label:'Plus Two (Bio Science)',type:'next',years:'2 years',cost:'₹15–40k',note:'Biology group required'},
      {label:'B.Sc Nursing',type:'goal',years:'4 years',cost:'₹40k–1L/yr',note:'High demand in Kerala, Gulf & abroad'},
    ]},
    { id:'path-c', label:'GNM Nursing (Diploma)', tag:'Affordable', tagColor:'gold', total_years:'4 years', total_cost:'₹1–3 lakhs', steps:[
      {label:'SSLC',type:'done',years:'',cost:'',note:'Your current level'},
      {label:'Plus Two (Bio Science)',type:'next',years:'2 years',cost:'₹15–40k',note:'PCB required'},
      {label:'GNM Diploma (General Nursing)',type:'goal',years:'3 years',cost:'₹30–60k/yr',note:'3-year diploma, government hospitals accept'},
    ]},
  ],
  'sslc-commerce': [
    { id:'path-a', label:'Commerce Stream → B.Com', tag:'Most Common', tagColor:'brand', total_years:'5 years', total_cost:'₹1–4 lakhs', steps:[
      {label:'SSLC',type:'done',years:'',cost:'',note:'Your current level'},
      {label:'Plus Two (Commerce)',type:'next',years:'2 years',cost:'₹15–30k',note:'Accountancy, Business Studies, Economics'},
      {label:'B.Com / BBA / BCom CA',type:'goal',years:'3 years',cost:'₹20k–1L/yr',note:'Government colleges very affordable'},
    ]},
    { id:'path-b', label:'CA Foundation Route', tag:'High Earning', tagColor:'gold', total_years:'6 years', total_cost:'₹2–5 lakhs', steps:[
      {label:'SSLC',type:'done',years:'',cost:'',note:'Your current level'},
      {label:'Plus Two (Commerce)',type:'next',years:'2 years',cost:'₹15–30k',note:'Commerce stream'},
      {label:'CA Foundation Exam',type:'exam',years:'',cost:'',note:'ICAI exam — can start during Plus Two'},
      {label:'CA Intermediate + Final',type:'goal',years:'4+ years',cost:'₹50k–2L total',note:'One of the highest paying careers in India'},
    ]},
  ],
  'sslc-arts': [
    { id:'path-a', label:'Humanities → BA', tag:'Most Common', tagColor:'brand', total_years:'5 years', total_cost:'₹1–3 lakhs', steps:[
      {label:'SSLC',type:'done',years:'',cost:'',note:'Your current level'},
      {label:'Plus Two (Humanities)',type:'next',years:'2 years',cost:'₹15–30k',note:'History, Political Science, Literature, Economics'},
      {label:'BA / B.Sc / BFA',type:'goal',years:'3 years',cost:'₹15–60k/yr',note:'Wide choice across Kerala universities'},
    ]},
  ],
  'sslc-law': [
    { id:'path-a', label:'Integrated BA LLB (5yr)', tag:'Recommended', tagColor:'brand', total_years:'7 years', total_cost:'₹2–6 lakhs', steps:[
      {label:'SSLC',type:'done',years:'',cost:'',note:'Your current level'},
      {label:'Plus Two (Any Stream)',type:'next',years:'2 years',cost:'₹15–40k',note:'Any stream accepted for law'},
      {label:'CLAT / KLEE Entrance',type:'exam',years:'',cost:'',note:'Common Law Entrance Test'},
      {label:'BA LLB / BBA LLB (5yr)',type:'goal',years:'5 years',cost:'₹20k–1L/yr',note:'Integrated 5-year degree — most popular route'},
    ]},
  ],
  'sslc-agriculture': [
    { id:'path-a', label:'Agriculture Science Route', tag:'Recommended', tagColor:'brand', total_years:'6 years', total_cost:'₹2–5 lakhs', steps:[
      {label:'SSLC',type:'done',years:'',cost:'',note:'Your current level'},
      {label:'Plus Two (Bio Science)',type:'next',years:'2 years',cost:'₹15–40k',note:'Biology/Agriculture group'},
      {label:'B.Sc Agriculture Entrance',type:'exam',years:'',cost:'',note:'Kerala Agricultural University entrance'},
      {label:'B.Sc Agriculture',type:'goal',years:'4 years',cost:'₹25k–80k/yr',note:'Kerala Agricultural University (KAU) — high demand'},
    ]},
  ],
  'sslc-pharmacy': [
    { id:'path-a', label:'D.Pharm → B.Pharm Route', tag:'Step by Step', tagColor:'brand', total_years:'5 years', total_cost:'₹2–6 lakhs', steps:[
      {label:'SSLC',type:'done',years:'',cost:'',note:'Your current level'},
      {label:'Plus Two (Science/PCB)',type:'next',years:'2 years',cost:'₹15–40k',note:'Biology or Maths group accepted'},
      {label:'D.Pharm (Diploma)',type:'next',years:'2 years',cost:'₹30–60k/yr',note:'Can join after Plus Two directly'},
      {label:'B.Pharm (Lateral Entry)',type:'goal',years:'3 years',cost:'₹35–80k/yr',note:'Join 2nd year with D.Pharm certificate'},
    ]},
  ],
  'plus2-engineering': [
    { id:'path-a', label:'Direct B.Tech', tag:'Standard Route', tagColor:'brand', total_years:'4 years', total_cost:'₹1–12 lakhs', steps:[
      {label:'Plus Two (Science/PCM)',type:'done',years:'',cost:'',note:'Your current level'},
      {label:'KEAM / JEE Entrance',type:'exam',years:'',cost:'',note:'Score well for Government seat'},
      {label:'B.Tech CSE / ECE / Civil',type:'goal',years:'4 years',cost:'₹20k–3L/yr',note:'Govt: ₹20k/yr · Private: up to ₹3L/yr'},
    ]},
    { id:'path-b', label:'Diploma Then Lateral Entry', tag:'If KEAM missed', tagColor:'gold', total_years:'4 years', total_cost:'₹1–5 lakhs', steps:[
      {label:'Plus Two (Science)',type:'done',years:'',cost:'',note:'Your current level'},
      {label:'Diploma in Engineering',type:'next',years:'2 years',cost:'₹10–25k',note:'Polytechnic — if KEAM rank is not enough'},
      {label:'Lateral Entry Exam',type:'exam',years:'',cost:'',note:'LET — Join B.Tech 2nd year'},
      {label:'B.Tech (2nd Year)',type:'goal',years:'3 years',cost:'₹20k–3L/yr',note:'Alternative if direct B.Tech not possible'},
    ]},
  ],
  'plus2-medical': [
    { id:'path-a', label:'MBBS / BDS Route', tag:'Standard Route', tagColor:'brand', total_years:'5.5 years', total_cost:'₹3–80 lakhs', steps:[
      {label:'Plus Two (PCB)',type:'done',years:'',cost:'',note:'Your current level'},
      {label:'NEET Entrance',type:'exam',years:'',cost:'',note:'Score 550+ for Government MBBS seat in Kerala'},
      {label:'MBBS / BDS',type:'goal',years:'5.5 years',cost:'₹65k–15L/yr',note:'Govt: ₹65k/yr · Private: up to ₹15L/yr'},
    ]},
    { id:'path-b', label:'B.Sc Nursing Route', tag:'Faster & Affordable', tagColor:'gold', total_years:'4 years', total_cost:'₹2–5 lakhs', steps:[
      {label:'Plus Two (PCB)',type:'done',years:'',cost:'',note:'Your current level'},
      {label:'B.Sc Nursing',type:'goal',years:'4 years',cost:'₹40k–1L/yr',note:'No entrance exam for most private colleges'},
    ]},
  ],
  'plus2-commerce': [
    { id:'path-a', label:'B.Com / BBA', tag:'Standard Route', tagColor:'brand', total_years:'3 years', total_cost:'₹60k–3 lakhs', steps:[
      {label:'Plus Two (Commerce)',type:'done',years:'',cost:'',note:'Your current level'},
      {label:'B.Com / BBA / B.Com CA',type:'goal',years:'3 years',cost:'₹20k–1L/yr',note:'Many Govt & Aided colleges in Kerala'},
    ]},
    { id:'path-b', label:'CA Foundation Route', tag:'High Earning', tagColor:'gold', total_years:'3-5 years', total_cost:'₹1–3 lakhs', steps:[
      {label:'Plus Two (Commerce)',type:'done',years:'',cost:'',note:'Your current level'},
      {label:'CA Foundation',type:'exam',years:'',cost:'',note:'Can start while in Plus Two itself'},
      {label:'CA Intermediate + Final',type:'goal',years:'3–5 years',cost:'₹50k–2L total',note:'ICAI — highest paying career in finance'},
    ]},
  ],
  'plus2-arts': [
    { id:'path-a', label:'BA / B.Sc Route', tag:'Standard Route', tagColor:'brand', total_years:'3 years', total_cost:'₹45k–2 lakhs', steps:[
      {label:'Plus Two (Humanities)',type:'done',years:'',cost:'',note:'Your current level'},
      {label:'BA / B.Sc / BFA / BPEd',type:'goal',years:'3 years',cost:'₹15k–60k/yr',note:'University of Kerala, MG University, Calicut University'},
    ]},
  ],
  'plus2-law': [
    { id:'path-a', label:'5-Year Integrated LLB', tag:'Best Option', tagColor:'brand', total_years:'5 years', total_cost:'₹1–5 lakhs', steps:[
      {label:'Plus Two (Any Stream)',type:'done',years:'',cost:'',note:'Your current level'},
      {label:'CLAT / KLEE Entrance',type:'exam',years:'',cost:'',note:'State and national law entrance exams'},
      {label:'BA LLB / BBA LLB (5yr)',type:'goal',years:'5 years',cost:'₹20k–1L/yr',note:'5-year integrated — best choice after Plus Two'},
    ]},
    { id:'path-b', label:'Degree then 3yr LLB', tag:'After BA/B.Com', tagColor:'gold', total_years:'6 years', total_cost:'₹1–4 lakhs', steps:[
      {label:'Plus Two (Any Stream)',type:'done',years:'',cost:'',note:'Your current level'},
      {label:'Any Degree (BA/B.Com/BBA)',type:'next',years:'3 years',cost:'₹20k–1L/yr',note:'Complete any undergraduate degree first'},
      {label:'LLB (3 Year)',type:'goal',years:'3 years',cost:'₹20k–80k/yr',note:'3-year law after graduation'},
    ]},
  ],
  'plus2-agriculture': [
    { id:'path-a', label:'B.Sc Agriculture', tag:'Recommended', tagColor:'brand', total_years:'4 years', total_cost:'₹1–4 lakhs', steps:[
      {label:'Plus Two (Bio/PCB)',type:'done',years:'',cost:'',note:'Your current level'},
      {label:'KAU / ICAR Entrance',type:'exam',years:'',cost:'',note:'Kerala Agricultural University entrance exam'},
      {label:'B.Sc Agriculture',type:'goal',years:'4 years',cost:'₹25k–80k/yr',note:'Great scope in Kerala, Central Govt jobs'},
    ]},
  ],
  'plus2-pharmacy': [
    { id:'path-a', label:'D.Pharm → B.Pharm', tag:'Common Route', tagColor:'brand', total_years:'5 years', total_cost:'₹2–6 lakhs', steps:[
      {label:'Plus Two (Science)',type:'done',years:'',cost:'',note:'Your current level'},
      {label:'D.Pharm (2yr Diploma)',type:'next',years:'2 years',cost:'₹30–60k/yr',note:'Pharmacy Council of India approved'},
      {label:'B.Pharm Lateral Entry',type:'goal',years:'3 years',cost:'₹35–80k/yr',note:'Join 2nd year B.Pharm with D.Pharm'},
    ]},
    { id:'path-b', label:'Direct B.Pharm', tag:'4-Year Degree', tagColor:'gold', total_years:'4 years', total_cost:'₹1.5–4 lakhs', steps:[
      {label:'Plus Two (Science)',type:'done',years:'',cost:'',note:'Your current level'},
      {label:'B.Pharm',type:'goal',years:'4 years',cost:'₹35–80k/yr',note:'Direct 4-year degree — better qualification'},
    ]},
  ],
  'iti-engineering': [
    { id:'path-a', label:'Diploma then B.Tech', tag:'Recommended', tagColor:'brand', total_years:'5 years', total_cost:'₹1–5 lakhs', steps:[
      {label:'ITI Certificate',type:'done',years:'',cost:'',note:'Your current level'},
      {label:'Diploma (2nd Year Direct)',type:'next',years:'2 years',cost:'₹10–25k',note:'ITI holders get direct 2nd year admission'},
      {label:'Lateral Entry Exam (LET)',type:'exam',years:'',cost:'',note:'After Diploma, enter B.Tech 2nd year'},
      {label:'B.Tech',type:'goal',years:'3 years',cost:'₹20k–3L/yr',note:'Full engineering degree path'},
    ]},
  ],
  'diploma-engineering': [
    { id:'path-a', label:'Lateral Entry B.Tech', tag:'Best Option', tagColor:'brand', total_years:'3 years', total_cost:'₹1–9 lakhs', steps:[
      {label:'Diploma (Polytechnic)',type:'done',years:'',cost:'',note:'Your current level'},
      {label:'Lateral Entry Exam (LET)',type:'exam',years:'',cost:'',note:'Kerala LET — direct 2nd year B.Tech admission'},
      {label:'B.Tech (2nd year)',type:'goal',years:'3 years',cost:'₹20k–3L/yr',note:'Save 1 full year compared to fresh B.Tech'},
    ]},
  ],
  'btech-engineering': [
    { id:'path-a', label:'M.Tech (GATE)', tag:'Research/Academic', tagColor:'brand', total_years:'2 years', total_cost:'₹50k–3 lakhs', steps:[
      {label:'B.Tech',type:'done',years:'',cost:'',note:'Your current level'},
      {label:'GATE Exam',type:'exam',years:'',cost:'',note:'Score 600+ for IIT/NIT — stipend possible'},
      {label:'M.Tech',type:'goal',years:'2 years',cost:'₹25k–1.5L/yr',note:'GATE qualified → ₹12,400/month stipend possible'},
    ]},
    { id:'path-b', label:'MBA (CAT/MAT)', tag:'Management', tagColor:'gold', total_years:'2 years', total_cost:'₹3–15 lakhs', steps:[
      {label:'B.Tech',type:'done',years:'',cost:'',note:'Your current level'},
      {label:'CAT / MAT / KMAT Exam',type:'exam',years:'',cost:'',note:'Management entrance — CAT for IIMs'},
      {label:'MBA',type:'goal',years:'2 years',cost:'₹1.5–7.5L/yr',note:'IIM or Kerala management colleges — great ROI'},
    ]},
    { id:'path-c', label:'LLB (Tech-Law)', tag:'Growing Field', tagColor:'gold', total_years:'3 years', total_cost:'₹60k–3 lakhs', steps:[
      {label:'B.Tech',type:'done',years:'',cost:'',note:'Your current level'},
      {label:'LLB (3 Year)',type:'goal',years:'3 years',cost:'₹20k–1L/yr',note:'IP law, tech law — high demand with engineering background'},
    ]},
  ],
  'btech-commerce': [
    { id:'path-a', label:'MBA in Finance/Marketing', tag:'Top Choice', tagColor:'brand', total_years:'2 years', total_cost:'₹2–15 lakhs', steps:[
      {label:'B.Tech',type:'done',years:'',cost:'',note:'Your current level'},
      {label:'CAT / KMAT Exam',type:'exam',years:'',cost:'',note:'Management entrance test'},
      {label:'MBA',type:'goal',years:'2 years',cost:'₹1.5–7.5L/yr',note:'Finance or Operations MBA — great for engineers'},
    ]},
  ],
  'btech-law': [
    { id:'path-a', label:'LLB After B.Tech', tag:'Tech-Law', tagColor:'brand', total_years:'3 years', total_cost:'₹60k–3 lakhs', steps:[
      {label:'B.Tech',type:'done',years:'',cost:'',note:'Your current level'},
      {label:'LLB (3 yr)',type:'goal',years:'3 years',cost:'₹20k–1L/yr',note:'Growing demand for tech lawyers in India'},
    ]},
  ],
  'mtech-engineering': [
    { id:'path-a', label:'PhD / Research', tag:'Academic', tagColor:'brand', total_years:'3-5 years', total_cost:'₹1–5 lakhs', steps:[
      {label:'M.Tech',type:'done',years:'',cost:'',note:'Your current level'},
      {label:'NET / GATE (Research)',type:'exam',years:'',cost:'',note:'National Eligibility Test for JRF/SRF fellowships'},
      {label:'Ph.D',type:'goal',years:'3–5 years',cost:'Free + stipend',note:'University stipend ₹31,000–35,000/month (JRF)'},
    ]},
    { id:'path-b', label:'Industry / Corporate', tag:'High Salary', tagColor:'gold', total_years:'Immediate', total_cost:'N/A', steps:[
      {label:'M.Tech',type:'done',years:'',cost:'',note:'Your current level'},
      {label:'Campus Placement / Job',type:'goal',years:'Immediate',cost:'',note:'M.Tech avg salary Kerala ₹6–18 LPA'},
    ]},
  ],
};

// ── API ROUTES ────────────────────────────────────────────────────────────────

// GET /api/colleges
app.get('/api/colleges', async (req, res) => {
  try {
    const { field, district, type, naac, fee_max, search, page = 1, limit = 50 } = req.query;
    const query = {};
    if (field)    query['courses.field'] = field;
    if (district) query.district = district;
    if (type)     query.type = type;
    if (naac)     query.naac = naac;
    if (search)   query.$text = { $search: search };

    let colleges = await College.find(query)
      .select('-reports')
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    if (fee_max) {
      const max = Number(fee_max);
      colleges = colleges.filter(c => {
        const total = (c.fees.semester * 2) + (c.fees.bus * 2) + c.fees.hostel + c.fees.food;
        return total <= max;
      });
    }

    res.json({ colleges, meta: { total: colleges.length, page: Number(page) } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch colleges' });
  }
});

// GET /api/colleges/:id
app.get('/api/colleges/:id', async (req, res) => {
  try {
    const college = await College.findById(req.params.id).select('-reports').lean();
    if (!college) return res.status(404).json({ error: 'Not found' });
    res.json(college);
  } catch {
    res.status(500).json({ error: 'Failed to fetch college' });
  }
});

// GET /api/roadmap
app.get('/api/roadmap', (req, res) => {
  const { level, field } = req.query;
  if (!level || !field) return res.status(400).json({ error: 'level and field required' });
  const key = `${level}-${field}`;
  res.json({ key, paths: ROADMAP_PATHS[key] || null });
});

// GET /api/districts — for filter UI
app.get('/api/districts', async (_req, res) => {
  try {
    const districts = await College.distinct('districts');
    // Return all 14 districts statically for reliability
    res.json({ districts: ['Kasaragod','Kannur','Wayanad','Kozhikode','Malappuram','Palakkad','Thrissur','Ernakulam','Idukki','Kottayam','Alappuzha','Pathanamthitta','Kollam','Thiruvananthapuram'] });
  } catch {
    res.status(500).json({ error: 'Failed' });
  }
});

// POST /api/report
app.post('/api/report', async (req, res) => {
  try {
    const { college_id, message } = req.body;
    if (!college_id || !message) return res.status(400).json({ error: 'college_id and message required' });
    await College.findByIdAndUpdate(college_id, { $push: { reports: { message } } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

// POST /api/chat — Groq free API (llama-3.1-8b-instant, 14,400 req/day free)
// POST /api/chat — Groq, language-aware, database-grounded, structured
app.post('/api/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    if (!message) return res.status(400).json({ error: 'message required' });

    // ── Language detection ─────────────────────────────────────────────────
    // Check for Malayalam Unicode range (0D00–0D7F)
    const malayalamChars = (message.match(/[\u0D00-\u0D7F]/g) || []).length;
    const totalChars     = message.replace(/\s/g, '').length;
    const malayalamRatio = totalChars > 0 ? malayalamChars / totalChars : 0;

    // Only treat as Malayalam if MORE THAN 40% of characters are Malayalam script
    // This prevents English messages with one Malayalam word being detected as Malayalam
    const lang = malayalamRatio > 0.4 ? 'malayalam' : 'english';

    // ── Smart keyword college search ───────────────────────────────────────
    // Extract meaningful keywords from the message (remove common words)
    const stopWords = ['the','a','an','is','are','what','which','how','much','fee','of',
                       'in','at','for','and','or','to','about','tell','me','i','my',
                       'want','know','please','can','you','this','that','college',
                       'university','institute','school'];

    const keywords = message
      .toLowerCase()
      .replace(/[?.,!]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.includes(w));

    // ── Fetch colleges for context ─────────────────────────────────────────
    let collegeList = [];

    // Strategy 1: if context field/district provided, fetch those colleges
    if (context?.field || context?.district) {
      const q = {};
      if (context.field)    q['courses.field'] = context.field;
      if (context.district) q.district = context.district;
      collegeList = await College.find(q)
        .select('name short district type naac fees courses affiliation website management_quota_fee rating established')
        .limit(8).lean();
    }

    // Strategy 2: keyword search against college name and short name
    // Build a regex from each keyword and search name/short fields
    if (keywords.length > 0) {
      // Try each keyword as a partial name match
      const keywordRegexes = keywords.map(k => ({
        $or: [
          { name:  { $regex: k, $options: 'i' } },
          { short: { $regex: k, $options: 'i' } },
          { district: { $regex: k, $options: 'i' } },
          { 'courses.name': { $regex: k, $options: 'i' } },
        ]
      }));

      const keywordMatches = await College.find({ $or: keywordRegexes.flatMap(r => r.$or) })
        .select('name short district type naac fees courses affiliation website management_quota_fee rating established')
        .limit(6).lean();

      // Merge with existing list, avoid duplicates
      const existingIds = new Set(collegeList.map(c => c._id.toString()));
      keywordMatches.forEach(c => {
        if (!existingIds.has(c._id.toString())) {
          collegeList.push(c);
          existingIds.add(c._id.toString());
        }
      });
    }

    // Strategy 3: if still no colleges found, fetch a general sample
    if (collegeList.length === 0) {
      collegeList = await College.find({})
        .select('name short district type naac fees courses affiliation website management_quota_fee rating')
        .limit(6).lean();
    }

    // ── Build database context string ──────────────────────────────────────
    let dbContext = '';
    if (collegeList.length > 0) {
      dbContext = '\n\n=== KERALA COLLEGE DATABASE (use this for fee and college questions) ===\n' +
        collegeList.map((c, i) => {
          const semAnnual  = c.fees.semester * 2;
          const busAnnual  = c.fees.bus      * 2;
          const total      = semAnnual + busAnnual + c.fees.hostel + c.fees.food;
          const courseList = c.courses.map(x => `${x.name} (${x.seats} seats)`).join(', ');
          return `[${i+1}] ${c.name} | Short: ${c.short}
  Location: ${c.district} | Type: ${c.type} | NAAC: ${c.naac} | Rating: ${c.rating}/5
  Courses: ${courseList}
  Fees → Semester: ₹${semAnnual}/yr | Bus: ₹${busAnnual}/yr | Hostel: ₹${c.fees.hostel}/yr | Food: ₹${c.fees.food}/yr
  Total Annual Cost: ~₹${total.toLocaleString()}
  ${c.management_quota_fee > 0 ? `Management Quota Fee: ₹${c.management_quota_fee}` : 'No management quota (Govt/Merit only)'}
  Website: ${c.website}`;
        }).join('\n\n');
    }

    // ── System prompt ──────────────────────────────────────────────────────
    const langInstruction = lang === 'malayalam'
      ? 'IMPORTANT: The user is writing in Malayalam. You MUST reply in Malayalam script only. Do not use English words except for technical terms like B.Tech, NEET, KEAM, NAAC.'
      : 'IMPORTANT: The user is writing in English. You MUST reply in English only. Do not use Malayalam.';

    const SYSTEM = `You are Kerala Career Compass, a friendly career guidance assistant for Kerala students. You are like a helpful, knowledgeable senior who genuinely wants to guide students to the right path.

${langInstruction}

TOPIC BOUNDARY — only discuss:
✅ Career paths after SSLC, Plus Two, ITI, Diploma, B.Tech, M.Tech
✅ Kerala colleges — fees, NAAC grades, courses, seats, locations
✅ Entrance exams — KEAM, NEET, GATE, CAT, CLAT, KLEE, LET, KMAT, KAU, JEE
✅ Course comparisons — B.Tech vs Diploma, MBBS vs Nursing, B.Com vs CA, etc.
✅ Career scope — job market, salary ranges, industries in Kerala and India
✅ Admission process — how to apply, important dates, documents needed
✅ Scholarships — Kerala state scholarships, merit, minority scholarships
✅ Exam preparation — how to prepare for KEAM, NEET, GATE etc.

❌ For anything outside education and careers, reply: "I'm your Kerala career guide — I can only help with college admissions, career paths, and education. Ask me anything about that! 😊"

COLLEGE SEARCH RULE:
If the user mentions a partial college name (like "nehru", "cusat", "amrita", "rajagiri") — search the database context below and answer about that specific college. Always match partial names intelligently.

RESPONSE RULES:
- Be warm, encouraging, specific — like a helpful friend not a robot
- For fee questions → structured breakdown with ₹ values from database
- For career path questions → use step format: SSLC → Plus Two → B.Tech
- For college questions → use data from the database context provided
- For exam prep, career scope → use real knowledge, give actionable advice
- For "which is better" → give a real opinion with clear reasoning
- Keep responses under 250 words
- End fee answers with: ⚠️ Fees change yearly — verify directly with the college.
- Never say "based on the database" or "I cannot find in database" — just answer naturally
${dbContext}`;

    // ── Call Groq API ──────────────────────────────────────────────────────
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 600,
        temperature: 0.4,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user',   content: message },
        ],
      }),
    });

    if (!groqRes.ok) {
      const err = await groqRes.json();
      console.error('Groq error:', err);
      return res.status(500).json({ error: 'AI unavailable. Try again shortly.' });
    }

    const data  = await groqRes.json();
    const reply = data.choices[0].message.content;

    res.json({ reply, lang });

  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'AI response failed.' });
  }
});

// ── START ─────────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');
    await seedIfEmpty();  // auto-seed on first run
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server → http://localhost:${PORT}`));
  })
  .catch(err => { console.error('❌ MongoDB:', err.message); process.exit(1); });