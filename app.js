// Shared Cloud Database Integration for Socio-O-Thon
const ADMIN_PIN = "1234";
const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1_l9WvZ9ZJzhhij0QR0IRe388gP2lt-RNctH2qeErW9U/export?format=csv";
const GOOGLE_SHEET_API_URL = "https://script.google.com/macros/s/AKfycbw7p21WbHuWVn3iclq8PUCjpfDZrCXQEkpZMuV8TruuZtNcIJjzU1zw5hNEiVtJqUVg/exec";
const LOCAL_STORAGE_KEY = "socioOthon_participants_v4";

const defaultSeed = [
  {
    "id": "SOT001",
    "name": "Purushottam sam sunder",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "pss.purushottam@gmail.com",
      "Contact": "9344141746"
    }
  },
  {
    "id": "SOT002",
    "name": "Rahul Pradhan",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "26ai114028@rgnau.ac.in",
      "Contact": "7008217572"
    }
  },
  {
    "id": "SOT003",
    "name": "NAGABATHULA SASIDHAR",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "sasidharnagabathula@gmail.com",
      "Contact": "8790350954"
    }
  },
  {
    "id": "SOT004",
    "name": "Sourya Sritam Sarangi",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "sourya07sarangi@gmail.com",
      "Contact": "7894742252"
    }
  },
  {
    "id": "SOT005",
    "name": "Himanshu Singh",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "himanshusinghgaur26@gmail.com",
      "Contact": "6388171218"
    }
  },
  {
    "id": "SOT006",
    "name": "Jahnavi Chaurasia",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "jahnavichaurasia67@gmail.com",
      "Contact": "9555531276"
    }
  },
  {
    "id": "SOT007",
    "name": "Umang Shankar Kishore",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "26ai114037@gmail.com",
      "Contact": "7903317467"
    }
  },
  {
    "id": "SOT008",
    "name": "Priyanshu Kumar Patel",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "priyanshukumarpatel789@gmail.com",
      "Contact": "8969776557"
    }
  },
  {
    "id": "SOT009",
    "name": "Atharva Singh Baghel",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "athnidhi1676@gmail.com",
      "Contact": "7974640071"
    }
  },
  {
    "id": "SOT010",
    "name": "Krishna Kumar",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "krishna958192@gmail.com",
      "Contact": "8809896525"
    }
  },
  {
    "id": "SOT011",
    "name": "Bhanu Pratap Singh",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "bhanu.singhcse24@smslucknow.ac.in",
      "Contact": "6207776437"
    }
  },
  {
    "id": "SOT012",
    "name": "Shankracharya Bharti",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "shankaracharyabharti40@gmail.com",
      "Contact": "8521566913"
    }
  },
  {
    "id": "SOT013",
    "name": "Saumya Sharma",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "saumya.skdian@gmail.com",
      "Contact": "6306391167"
    }
  },
  {
    "id": "SOT014",
    "name": "Sumit Kumar Patel",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "sumitkumarpatelcse25@smslucknow.ac.in",
      "Contact": "6201035429"
    }
  },
  {
    "id": "SOT015",
    "name": "Bathula Sanoj",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "26AE3005@rgipt.ac.in",
      "Contact": "7842961188"
    }
  },
  {
    "id": "SOT016",
    "name": "M. Gireesh Vema Rao",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "26ae3014@rgipt.ac.in",
      "Contact": "9515169896"
    }
  },
  {
    "id": "SOT017",
    "name": "Suryansh",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "suryanshiot@gmail.com",
      "Contact": "6306784525"
    }
  },
  {
    "id": "SOT018",
    "name": "HIMANSHU PANDEY",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "240694@kit.ac.in",
      "Contact": "9198003605"
    }
  },
  {
    "id": "SOT019",
    "name": "ANUSTHA SHARMA",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "240466@kit.ac.in",
      "Contact": "7905776123"
    }
  },
  {
    "id": "SOT020",
    "name": "AKASH JOSHI",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "developer.akashjoshi@gmail.com",
      "Contact": "9125847406"
    }
  },
  {
    "id": "SOT021",
    "name": "Kashvee Mehta",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "dev.kashvee@gmail.com",
      "Contact": "8887539149"
    }
  },
  {
    "id": "SOT022",
    "name": "Utkarsh Kumar Singh",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "utkarshphoenix67@gmail.com",
      "Contact": "9235087737"
    }
  },
  {
    "id": "SOT023",
    "name": "Tiwari Mayank",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "mayank54xd@gmail.com",
      "Contact": "8856815411"
    }
  },
  {
    "id": "SOT024",
    "name": "Prativa Sahoo",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "prativasahoo2006@gmail.com",
      "Contact": "7978701860"
    }
  },
  {
    "id": "SOT025",
    "name": "Abhijeet Kumar Singh",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "abhirajput1366@gmail.com",
      "Contact": "7783004239"
    }
  },
  {
    "id": "SOT026",
    "name": "ISHIKA SINGH",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "ishayyylko@gmail.com",
      "Contact": "7897777641"
    }
  },
  {
    "id": "SOT027",
    "name": "Aditya Gupta",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "adityagupta80098@gmail.com",
      "Contact": "8127657475"
    }
  },
  {
    "id": "SOT028",
    "name": "Ayush Mishra",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "ayushmishra0205ix@gmail.com",
      "Contact": "9369035137"
    }
  },
  {
    "id": "SOT029",
    "name": "Alok Sahu",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "aloksahu95190@gmail.com",
      "Contact": "9519027901"
    }
  },
  {
    "id": "SOT030",
    "name": "SARTHAK AGRAWAL",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "sarthakag24@iitk.ac.in",
      "Contact": "9696625701"
    }
  },
  {
    "id": "SOT031",
    "name": "rudresh kumar",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "rudreshthakur80@gmail.com",
      "Contact": "9369699470"
    }
  },
  {
    "id": "SOT032",
    "name": "Pratik Kumar Yadav",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "pratiky24@iitk.ac.in",
      "Contact": "8253084953"
    }
  },
  {
    "id": "SOT033",
    "name": "pranjal gautam",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "pranjalg24@iitk.ac.in",
      "Contact": "7454040860"
    }
  },
  {
    "id": "SOT034",
    "name": "Kartikey Agnihotri",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "kartikeyofficial12@gmail.com",
      "Contact": "8081260329"
    }
  },
  {
    "id": "SOT035",
    "name": "Kajal Singh",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "kajalsingh829407@gmail.com",
      "Contact": "8294077701"
    }
  },
  {
    "id": "SOT036",
    "name": "Avika Chauhan",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "s4916178@gmail.com",
      "Contact": "8318955925"
    }
  },
  {
    "id": "SOT037",
    "name": "Vaibhavi Shukla",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "vaibhavishukla45@gmail.com",
      "Contact": "7633912311"
    }
  },
  {
    "id": "SOT038",
    "name": "Kalash Mishra",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "kalashmishra2006@gmail.com",
      "Contact": "9415334228"
    }
  },
  {
    "id": "SOT039",
    "name": "Anirudh Mishra",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "mishrakumar1192005@gmail.com",
      "Contact": "8175961647"
    }
  },
  {
    "id": "SOT040",
    "name": "Aditya Dhanraj",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "dhanrajaditya262@gmail.com",
      "Contact": "7376548635"
    }
  },
  {
    "id": "SOT041",
    "name": "Priyanshi Maurya",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "mauryapriyanshi2526@gmail.com",
      "Contact": "9569542060"
    }
  },
  {
    "id": "SOT042",
    "name": "Nainshi Yadav",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "nainshi30309@gmail.com",
      "Contact": "8853303228"
    }
  },
  {
    "id": "SOT043",
    "name": "Tushar Periwal",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "tusharperiwal95@gmail.com",
      "Contact": "9395839383"
    }
  },
  {
    "id": "SOT044",
    "name": "Dipesh Sikhwal",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "meb25047@tezu.ac.in",
      "Contact": "8617443361"
    }
  },
  {
    "id": "SOT045",
    "name": "ADITYA RAJ",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "araj71248@gmail.com",
      "Contact": "8617391523"
    }
  },
  {
    "id": "SOT046",
    "name": "KANISHK KRISHAN",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "kanishk2772@gmail.com",
      "Contact": "7851954942"
    }
  },
  {
    "id": "SOT047",
    "name": "AYUSHMAAN KESARWANI",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "ayushmaankesarwani6@gmail.com",
      "Contact": "8958272744"
    }
  },
  {
    "id": "SOT048",
    "name": "SANDIHYA SATYA",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "sanidhyasatya9080@gmail.com",
      "Contact": "8434620922"
    }
  },
  {
    "id": "SOT049",
    "name": "ADITYA SHARMA",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "kanishk2772@gmail.com",
      "Contact": "8446937220"
    }
  },
  {
    "id": "SOT050",
    "name": "Vedika Bhatnagar",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "vedikabhatnagar19@gmail.com",
      "Contact": "9335618757"
    }
  },
  {
    "id": "SOT051",
    "name": "Divya Shahi",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "divya1shahi5@gmail.com",
      "Contact": "7898002168"
    }
  },
  {
    "id": "SOT052",
    "name": "Srishti Katiyar",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "25bb143035@rgnau.ac.in",
      "Contact": "8738928331"
    }
  },
  {
    "id": "SOT053",
    "name": "garima negi",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "25bb143013@rgnau.ac.in",
      "Contact": "9267923221"
    }
  },
  {
    "id": "SOT054",
    "name": "B.Nanda kishore",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "26cs3017@rgipt.ac.in",
      "Contact": "79891 79963"
    }
  },
  {
    "id": "SOT055",
    "name": "DOMMETI TEJA SRIVARDHAN",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "26cs3022@rgipt.ac.in",
      "Contact": "9666498388"
    }
  },
  {
    "id": "SOT056",
    "name": "YATHARTH SRIVASTAVA",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "26cd3036@rgipt.ac.in",
      "Contact": "6393848378"
    }
  },
  {
    "id": "SOT057",
    "name": "Gitanjali",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "25cs3019@rgipt.ac.in",
      "Contact": "7897540955"
    }
  },
  {
    "id": "SOT058",
    "name": "Tiyasa Kundu",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "25mc3064@rgipt.ac.in",
      "Contact": "9434060094"
    }
  },
  {
    "id": "SOT059",
    "name": "Soumya Singh",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "25it3055@rgipt.ac.in",
      "Contact": "7268909951"
    }
  },
  {
    "id": "SOT060",
    "name": "MADHURI KUMARI",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "25cd3020@rgipt.ac.in",
      "Contact": "9296900602"
    }
  },
  {
    "id": "SOT061",
    "name": "Pranav Mahajan",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "26ce3038@rgipt.ac.in",
      "Contact": "9389247074"
    }
  },
  {
    "id": "SOT062",
    "name": "Aryan Kushwaha",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "26ce3006@rgipt.ac.in",
      "Contact": "7081665856"
    }
  },
  {
    "id": "SOT063",
    "name": "Devansh",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "25ce3020@rgipt.ac.in",
      "Contact": "7417031824"
    }
  },
  {
    "id": "SOT064",
    "name": "Kalavala Maneesh",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "25ce3028@rgipt.ac.in",
      "Contact": "7569734770"
    }
  },
  {
    "id": "SOT065",
    "name": "Prince Prajapati",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "25cd3029@rgipt.ac.in",
      "Contact": "8756224155"
    }
  },
  {
    "id": "SOT066",
    "name": "Deepak Kumar",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "25pp3006@rgipt.ac.in",
      "Contact": "7073389905"
    }
  },
  {
    "id": "SOT067",
    "name": "P Darshit",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "26cd3023@rgipt.ac.in",
      "Contact": "9476109044"
    }
  },
  {
    "id": "SOT068",
    "name": "Jaiditya Sinha",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "jaidityasinha200@gmail.com",
      "Contact": "9308250700"
    }
  },
  {
    "id": "SOT069",
    "name": "Sriwanth Reddy",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "sriwanthalla@gmail.com",
      "Contact": "9515331577"
    }
  },
  {
    "id": "SOT070",
    "name": "Aditya Deshmukh",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "adityadeshmukh5115@gmail.com",
      "Contact": "8830981635"
    }
  },
  {
    "id": "SOT071",
    "name": "Krishna Agrawal",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "agrk1603@gmail.com",
      "Contact": "9236428463"
    }
  },
  {
    "id": "SOT072",
    "name": "Nimish Singh",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "nimish120838@gmail.com",
      "Contact": "9076721337"
    }
  },
  {
    "id": "SOT073",
    "name": "Devesh Singh",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "deveshsingh2424@gmail.com",
      "Contact": "8604283039"
    }
  },
  {
    "id": "SOT074",
    "name": "SANKALP",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "singhsankalp678@gmail.com",
      "Contact": "7054490586"
    }
  },
  {
    "id": "SOT075",
    "name": "Vaibhav Nehra",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "vaibhavxnehrax@gmail.com",
      "Contact": "8814092519"
    }
  },
  {
    "id": "SOT076",
    "name": "Maittri Tripathi",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "24mc3027@rgipt.ac.in",
      "Contact": "7976034702"
    }
  },
  {
    "id": "SOT077",
    "name": "Ayush Kumar Srivastava",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "ayushkrsrivastava2005@gmail.com",
      "Contact": "9555532680"
    }
  },
  {
    "id": "SOT078",
    "name": "Divyansh Ojha",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "25ce3023@rgipt.ac.in",
      "Contact": "9336385828"
    }
  },
  {
    "id": "SOT079",
    "name": "Amber Pal",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "25re3004@rgipt.ac.in",
      "Contact": "7307264829"
    }
  },
  {
    "id": "SOT080",
    "name": "Nilim Choudhury",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "25pp3013@rgipt.ac.in",
      "Contact": "8761011885"
    }
  },
  {
    "id": "SOT081",
    "name": "Disha Agarwal",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "25ce3022@rgipt.ac.in",
      "Contact": "7500023600"
    }
  },
  {
    "id": "SOT082",
    "name": "Aman Raj",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "25ce3008@rgipt.ac.in",
      "Contact": "7257886304"
    }
  },
  {
    "id": "SOT083",
    "name": "Monali Tiwari",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "monalitiwari.in@gmail.com",
      "Contact": "9831105712"
    }
  },
  {
    "id": "SOT084",
    "name": "Prajukta Jana",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "prajuktaj@gmail.com"
    }
  },
  {
    "id": "SOT085",
    "name": "Dipti Kumari",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "diptikumari2306@gmail.com"
    }
  },
  {
    "id": "SOT086",
    "name": "Dimpy Bhattacharjee",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "dimpybhattacharjee213@gmail.com"
    }
  },
  {
    "id": "SOT087",
    "name": "Shikhar Gupta",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "24ce3051@rgipt.ac.in",
      "Contact": "7000435256"
    }
  },
  {
    "id": "SOT088",
    "name": "Dev Jangid",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "24ce3022@rgipt.ac.in"
    }
  },
  {
    "id": "SOT089",
    "name": "Chirantan Toley",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "24ce3020@rgipt.ac.in"
    }
  },
  {
    "id": "SOT090",
    "name": "Gourav Yadav",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "24ce3026@rgipt.ac.in"
    }
  },
  {
    "id": "SOT091",
    "name": "VISHWA P",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "babyvishwa2008@gmail.com",
      "Contact": "8838396227"
    }
  },
  {
    "id": "SOT092",
    "name": "SHAMYUKTHA S",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "shamyukthas08@gmail.com",
      "Contact": "8825434574"
    }
  },
  {
    "id": "SOT093",
    "name": "NIRANJAN A M",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "amniranjan007@gmail.com",
      "Contact": "9442798088"
    }
  },
  {
    "id": "SOT094",
    "name": "SUHASHINI V A",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "suhashinivadivel2006@gmail.com",
      "Contact": "8428881222"
    }
  },
  {
    "id": "SOT095",
    "name": "Raghubir Rai",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "25ce3064@rgipt.ac.in",
      "Contact": "8957276668"
    }
  },
  {
    "id": "SOT096",
    "name": "Ayush Kumar",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "25cs3007@rgipt.ac.in"
    }
  },
  {
    "id": "SOT097",
    "name": "Anil Suthar N",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "25me3003@rgipt.ac.in"
    }
  },
  {
    "id": "SOT098",
    "name": "Abhinav Jaiswal",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "25re3002@rgipt.ac.in"
    }
  },
  {
    "id": "SOT099",
    "name": "SIDDHARTH SINGH",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "240378@kit.ac.in",
      "Contact": "8303558840"
    }
  },
  {
    "id": "SOT100",
    "name": "Kratika Gupta",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "gkratika202@gmail.com",
      "Contact": "9235352300"
    }
  },
  {
    "id": "SOT101",
    "name": "Swati Yadav",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "swatiydv.2805@gmail.com",
      "Contact": "8173939363"
    }
  },
  {
    "id": "SOT102",
    "name": "Rachit Aggarwal",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "26cs3054@rgipt.ac.in",
      "Contact": "9528904043"
    }
  },
  {
    "id": "SOT103",
    "name": "HITEN Bansal",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "26cs3027@rgipt.ac.in",
      "Contact": "7056390801"
    }
  },
  {
    "id": "SOT104",
    "name": "Aditya Pratap Singh",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "26cs3005@rgipt.ac.in",
      "Contact": "9451773050"
    }
  },
  {
    "id": "SOT105",
    "name": "Aditya Awasthi",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "26cs3004@rgipt.ac.in",
      "Contact": "8962603638"
    }
  },
  {
    "id": "SOT106",
    "name": "Prashant Lavania",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "prashantlavania9@gmail.com",
      "Contact": "9220369216"
    }
  },
  {
    "id": "SOT107",
    "name": "Dipak Kumar",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "dipakbhagat934@gmail.com",
      "Contact": "9341196921"
    }
  },
  {
    "id": "SOT108",
    "name": "Sourya Sarangi",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "sourya07sarangi@gmail.com",
      "Contact": "7894742252"
    }
  },
  {
    "id": "SOT109",
    "name": "Rahul Pradhan",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "rgnppr93@gmail.com",
      "Contact": "7008271572"
    }
  },
  {
    "id": "SOT110",
    "name": "DIVYANSHU Raj Raj",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "rdivyanshu752@gmail.com",
      "Contact": "8877103516"
    }
  },
  {
    "id": "SOT111",
    "name": "Harshit Anand",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "harshitanand469@gmail.com",
      "Contact": "8789277595"
    }
  },
  {
    "id": "SOT112",
    "name": "Sana Arora",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "arorasana81@gmail.com",
      "Contact": "8700035292"
    }
  },
  {
    "id": "SOT113",
    "name": "NIKHIL KUMAR GAUTAM",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "nikhil73809@gmail.com",
      "Contact": "7380970355"
    }
  },
  {
    "id": "SOT114",
    "name": "OMJEE OJHA",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "ojhaaemail@gmail.com",
      "Contact": "8051420231"
    }
  },
  {
    "id": "SOT115",
    "name": "DIPAK OJHA",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "ojha09293@gmail.com",
      "Contact": "6299024068"
    }
  },
  {
    "id": "SOT116",
    "name": "ANANYA PANDEY",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "pandeyananya848@gmail.com",
      "Contact": "6391039210"
    }
  },
  {
    "id": "SOT117",
    "name": "RUDRANSH MISHRA",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "rudranshvns2006@gmail.com",
      "Contact": "6307606696"
    }
  },
  {
    "id": "SOT118",
    "name": "Saumya Ganeshe",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "24cs3048@rgipt.ac.in",
      "Contact": "7802020161"
    }
  },
  {
    "id": "SOT119",
    "name": "Riya Chaudhary",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "241027@kit.ac.in",
      "Contact": "9653040087"
    }
  },
  {
    "id": "SOT120",
    "name": "ABHISHEK kumar kumar",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "abhinav87976@gmail.com",
      "Contact": "9631372631"
    }
  },
  {
    "id": "SOT121",
    "name": "Narendra Girjaram Bambarde",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "bambardenarendra5@gmail.com",
      "Contact": "9403858554"
    }
  },
  {
    "id": "SOT122",
    "name": "SREEHARINARAYANAN v s",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "sreeharinarayanan_b261276ec@nitc.ac.in",
      "Contact": "7063905161"
    }
  },
  {
    "id": "SOT123",
    "name": "Priyal Shende",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "mbatm25033@iimsirmaur.ac.in",
      "Contact": "8805651859"
    }
  },
  {
    "id": "SOT124",
    "name": "Karan Gupta",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "karan.guptaaids24@smslucknow.ac.in",
      "Contact": "7376748506"
    }
  },
  {
    "id": "SOT125",
    "name": "Akanksha Yadav",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "24ce3004@rgipt.ac.in",
      "Contact": "8858477375"
    }
  },
  {
    "id": "SOT126",
    "name": "Himmat Singh",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "26it3017@rgipt.ac.in",
      "Contact": "8306881391"
    }
  },
  {
    "id": "SOT127",
    "name": "NILOY SAMADDER",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "26mc3046@rgipt.ac.in",
      "Contact": "6291587997"
    }
  }
];

let isOrganizerUnlocked = false;

// ── Undo & Redo History Stacks ──
let undoStack = [];
let redoStack = [];

function recordState(list) {
  undoStack.push(JSON.stringify(list));
  if (undoStack.length > 30) undoStack.shift(); // Keep last 30 states
  redoStack = []; // Clear redo when a new action is performed
  updateUndoRedoButtons();
}

// ── Google Sheet CSV Parsing & Cloud Retrieval ──
function parseCSV(text) {
  const lines = [];
  let row = [''];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];
    if (c === '"') {
      if (inQuotes && next === '"') {
        row[row.length - 1] += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      row.push('');
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && next === '\n') i++;
      lines.push(row);
      row = [''];
    } else {
      row[row.length - 1] += c;
    }
  }
  if (row.length > 1 || (row.length === 1 && row[0] !== '')) lines.push(row);
  return lines;
}

function isTruthy(val) {
  if (!val) return false;
  const s = String(val).trim().toUpperCase();
  return s === "YES" || s === "TRUE" || s === "1" || s === "CHECKED";
}

function parseParticipantsFromCSV(csvText) {
  const rows = parseCSV(csvText);
  if (!rows || rows.length < 2) return null;
  const headers = rows[0].map(h => h.trim());
  const idCol = headers.findIndex(h => /participant\s*id/i.test(h));
  const nameCol = headers.findIndex(h => /^name$/i.test(h));
    const kitCol = headers.findIndex(h => /kit/i.test(h));
  const accCol = headers.findIndex(h => /accommodation/i.test(h));
  const foodCol = headers.findIndex(h => /food/i.test(h));

  const list = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const rawId = (idCol !== -1 && r[idCol]) ? r[idCol].trim() : (r[0] ? r[0].trim() : "");
    if (!rawId) continue;
    const id = rawId.toUpperCase();
    const name = (nameCol !== -1 && r[nameCol]) ? r[nameCol].trim() : (r[1] ? r[1].trim() : ("Participant " + id));
    
    const status = {
      kit: kitCol !== -1 ? isTruthy(r[kitCol]) : isTruthy(r[3]),
      accommodation: accCol !== -1 ? isTruthy(r[accCol]) : isTruthy(r[4]),
      food: foodCol !== -1 ? isTruthy(r[foodCol]) : isTruthy(r[5])
    };

    const fields = {};
    for (let c = 0; c < headers.length; c++) {
      if (c === idCol || c === nameCol || c === kitCol || c === accCol || c === foodCol) continue;
      const h = headers[c];
      if (!h || /last\s*updated/i.test(h) || /team/i.test(h)) continue;
      const val = r[c] ? r[c].trim() : "";
      if (val) {
        fields[h] = val;
      }
    }

    list.push({ id, name, status, fields });
  }
  return list;
}

async function syncParticipantToGoogleSheet(p) {
  try {
    await fetch(GOOGLE_SHEET_API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "sync_status",
        id: p.id,
        name: p.name,
                status: p.status || {},
        fields: p.fields || {}
      })
    });
  } catch (e) {
    console.warn("Sheet sync error:", e);
  }
}

async function fetchParticipantsFromCloud() {
  let baseList = [];

  // 1. Fetch base imported list from data/participants.json
  try {
    const res = await fetch("./data/participants.json?_t=" + Date.now());
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json) && json.length > 0) {
        baseList = json;
      }
    }
  } catch (e) {}

  // 2. Fetch live Google Sheet CSV to overlay real-time status updates (kit/accommodation/food)
  try {
    const res = await fetch(GOOGLE_SHEET_CSV_URL + "&_t=" + Date.now());
    if (res.ok) {
      const csv = await res.text();
      const parsed = parseParticipantsFromCSV(csv);
      if (parsed && parsed.length > 0) {
        if (baseList.length === 0) {
          baseList = parsed;
        } else {
          const sheetMap = new Map(parsed.map(p => [p.id.toUpperCase(), p]));
          baseList = baseList.map(p => {
            const fromSheet = sheetMap.get(p.id.toUpperCase());
            if (fromSheet) {
              return {
                ...p,
                status: fromSheet.status || p.status,
                fields: { ...p.fields, ...fromSheet.fields }
              };
            }
            return p;
          });
        }
      }
    }
  } catch (err) {
    console.warn("Could not load from Google Sheet CSV, using local sources:", err);
  }

  // 3. Overlay any offline or local modifications from localStorage
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (saved) {
    try {
      const localList = JSON.parse(saved);
      if (Array.isArray(localList) && localList.length > 0) {
        if (baseList.length === 0) {
          baseList = localList;
        } else {
          const localMap = new Map(localList.map(p => [p.id.toUpperCase(), p]));
          baseList = baseList.map(p => {
            const fromLocal = localMap.get(p.id.toUpperCase());
            if (fromLocal && fromLocal.status) {
              return { ...p, ...fromLocal };
            }
            return p;
          });
        }
      }
    } catch (e) {}
  }

  if (baseList.length > 0) {
    baseList.sort((a, b) => {
      const numA = parseInt(String(a.id).replace(/\D/g, ""), 10) || 0;
      const numB = parseInt(String(b.id).replace(/\D/g, ""), 10) || 0;
      return numA - numB;
    });
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(baseList));
    return baseList;
  }

  return defaultSeed;
}

async function saveParticipantsToCloud(list) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  return true;
}

async function getParticipants() {
  return await fetchParticipantsFromCloud();
}

async function addParticipant(id, name) {
  const list = await fetchParticipantsFromCloud();
  const existing = list.find(p => p.id.toUpperCase() === id.toUpperCase());
  if (!existing) {
    recordState(list);
    const newParticipant = {
      id: id.toUpperCase(),
      name: name || `Participant ${id.toUpperCase()}`,
      status: { kit: false, accommodation: false, food: false },
      fields: {}
    };
    list.push(newParticipant);
    await saveParticipantsToCloud(list);
    await syncParticipantToGoogleSheet(newParticipant);
  }
  return { ok: true };
}

async function updateParticipantInfo(oldId, newId, newName) {
  const list = await fetchParticipantsFromCloud();
  const target = list.find(p => p.id.toUpperCase() === oldId.toUpperCase());
  if (!target) return false;

  if (oldId.toUpperCase() !== newId.toUpperCase()) {
    const duplicate = list.find(p => p.id.toUpperCase() === newId.toUpperCase());
    if (duplicate) {
      alert("Error: Another participant already has ID " + newId);
      return false;
    }
  }

  recordState(list);
  target.id = newId.toUpperCase();
  target.name = newName.trim();
  await saveParticipantsToCloud(list);
  await syncParticipantToGoogleSheet(target);
  return true;
}

async function deleteParticipant(id) {
  if (!confirm(`Are you sure you want to delete participant ${id}?`)) return false;
  const list = await fetchParticipantsFromCloud();
  recordState(list);
  const filtered = list.filter(p => p.id.toUpperCase() !== id.toUpperCase());
  await saveParticipantsToCloud(filtered);
  return true;
}

function participantUrl(id) {
  let base;
  if (
    !window.location.protocol ||
    window.location.protocol === "file:" ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === ""
  ) {
    base = "https://shikhii1456.github.io/Socio-o-thon";
  } else {
    base = window.location.href.split("?")[0].split("#")[0].replace(/\/+$/, "").replace(/\/index\.html$/i, "");
  }
  return `${base}/participant.html?id=${encodeURIComponent(id)}`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[ch]));
}

function render(list) {
  const grid = document.getElementById("participantGrid");
  grid.innerHTML = "";
  document.getElementById("participantCount").textContent = list.length;

  if (!list.length) {
    grid.innerHTML = `<div class="empty">No participants found.</div>`;
    return;
  }

  list.forEach(p => {
    const card = document.createElement("article");
    card.className = "participant-card";

    const checks = p.status ? Object.values(p.status) : [];
    const completed = checks.filter(Boolean).length;
    const totalChecks = checks.length || 3;
    const statusClass = (completed === totalChecks && totalChecks > 0) ? "complete" : "";
    const pUrl = participantUrl(p.id);

    let fieldsHtml = "";
    if (p.fields && Object.keys(p.fields).length > 0) {
      fieldsHtml = `<div style="font-size:12px; color:#64748b; margin-top:6px; line-height:1.4; text-align:left;">`;
      Object.entries(p.fields).forEach(([k, v]) => {
        if (v) fieldsHtml += `<div><strong>${escapeHtml(k)}:</strong> ${escapeHtml(v)}</div>`;
      });
      fieldsHtml += `</div>`;
    }

    // Controls only visible when unlocked by organizer with PIN!
    const organizerControls = isOrganizerUnlocked
      ? `<div style="display:flex; gap:4px;">
           <button class="button small secondary edit-btn" style="padding:4px 8px; font-size:11px;" title="Edit Name/ID">✏️ Edit</button>
           <button class="button small secondary del-btn" style="padding:4px 8px; font-size:11px; color:#ef4444;" title="Delete">🗑️</button>
         </div>`
      : "";

    const qrId = `qr-${p.id}`;
    card.innerHTML = `
      <div class="participant-meta" style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div>
          <span class="badge small ${statusClass}">${completed}/${totalChecks}</span>
        </div>
        ${organizerControls}
      </div>
      <div style="text-align:left; margin-top:8px;">
        <h3 class="print-participant-name" style="margin-top:2px;">${escapeHtml(p.name)}</h3>
        <div class="card-details-extra">${fieldsHtml}</div>
      </div>
      <div class="qr" id="${qrId}"></div>
      <div class="card-actions">
        <a class="button small" href="${pUrl}">👁️ View Record</a>
        <button class="button small secondary copy-btn" data-url="${pUrl}">Copy QR link</button>
      </div>
      <div class="url">${pUrl}</div>
    `;
    grid.appendChild(card);

    new QRCode(document.getElementById(qrId), {
      text: pUrl,
      width: 180,
      height: 180,
      correctLevel: QRCode.CorrectLevel.M
    });

    if (isOrganizerUnlocked) {
      card.querySelector(".edit-btn").addEventListener("click", async () => {
        const newId = prompt("Update Participant ID:", p.id);
        if (!newId || !newId.trim()) return;
        const newName = prompt("Update Participant Name:", p.name);
        if (!newName || !newName.trim()) return;

        await updateParticipantInfo(p.id, newId.trim(), newName.trim());
        await init();
      });

      card.querySelector(".del-btn").addEventListener("click", async () => {
        if (await deleteParticipant(p.id)) {
          await init();
        }
      });
    }
  });

  document.querySelectorAll(".copy-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      await navigator.clipboard.writeText(btn.dataset.url);
      const old = btn.textContent;
      btn.textContent = "Copied!";
      setTimeout(() => btn.textContent = old, 1200);
    });
  });
}

function exportExcelCSV() {
  const list = allParticipants;
  const customFieldKeys = new Set();
  list.forEach(p => {
    if (p.fields) Object.keys(p.fields).forEach(k => customFieldKeys.add(k));
  });
  const fieldKeysArr = Array.from(customFieldKeys);

  let csv = "\uFEFFParticipant ID,Name,Kit Received,Accommodation,Food Received";
  fieldKeysArr.forEach(k => csv += `,${k}`);
  csv += ",Total Checks Completed\n";

  list.forEach(p => {
    const kit = p.status && p.status.kit ? "YES" : "NO";
    const acc = p.status && p.status.accommodation ? "YES" : "NO";
    const food = p.status && p.status.food ? "YES" : "NO";
    const checks = p.status ? Object.values(p.status) : [];
    const completed = checks.filter(Boolean).length;
    
    let line = `"${p.id}","${p.name.replace(/"/g, '""')}","${kit}","${acc}","${food}"`;
    
    fieldKeysArr.forEach(k => {
      const val = (p.fields && p.fields[k]) ? p.fields[k] : "";
      line += `,"${String(val).replace(/"/g, '""')}"`;
    });

    line += `,"${completed}/${checks.length || 3}"\n`;
    csv += line;
  });
  
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Socio-O-Thon-Participants-${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

let allParticipants = [];

async function init() {
  allParticipants = await getParticipants();
  render(allParticipants);
}

init();

document.getElementById("search").addEventListener("input", e => {
  const q = e.target.value.toLowerCase().trim();
  render(allParticipants.filter(p =>
    p.id.toLowerCase().includes(q) ||
    p.name.toLowerCase().includes(q) ||
    (p.fields && Object.values(p.fields).some(v => String(v).toLowerCase().includes(q)))
  ));
});

// ── Organizer Lock / Unlock Handler ──
const organizerToggleBtn = document.getElementById("organizerToggleBtn");
const organizerModeTag = document.getElementById("organizerModeTag");
const addParticipantBtn = document.getElementById("addParticipantBtn");
const dashPinModal = document.getElementById("dashPinModal");
const dashPinInput = document.getElementById("dashPinInput");
const dashPinError = document.getElementById("dashPinError");
const submitDashPinBtn = document.getElementById("submitDashPinBtn");
const cancelDashPinBtn = document.getElementById("cancelDashPinBtn");

const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");

function updateUndoRedoButtons() {
  if (!undoBtn || !redoBtn) return;
  undoBtn.disabled = undoStack.length === 0;
  redoBtn.disabled = redoStack.length === 0;
  undoBtn.style.opacity = undoStack.length === 0 ? "0.5" : "1";
  redoBtn.style.opacity = redoStack.length === 0 ? "0.5" : "1";
}

async function handleUndo() {
  if (undoStack.length === 0) return;
  const currentJson = JSON.stringify(allParticipants);
  redoStack.push(currentJson);
  const previousJson = undoStack.pop();
  allParticipants = JSON.parse(previousJson);
  await saveParticipantsToCloud(allParticipants);
  render(allParticipants);
  updateUndoRedoButtons();
}

async function handleRedo() {
  if (redoStack.length === 0) return;
  const currentJson = JSON.stringify(allParticipants);
  undoStack.push(currentJson);
  const nextJson = redoStack.pop();
  allParticipants = JSON.parse(nextJson);
  await saveParticipantsToCloud(allParticipants);
  render(allParticipants);
  updateUndoRedoButtons();
}

if (undoBtn) undoBtn.addEventListener("click", handleUndo);
if (redoBtn) redoBtn.addEventListener("click", handleRedo);

function updateOrganizerUi() {
  if (isOrganizerUnlocked) {
    organizerToggleBtn.textContent = "🔓 Lock Dashboard";
    organizerToggleBtn.style.background = "#059669";
    organizerModeTag.classList.remove("hidden");
    addParticipantBtn.classList.remove("hidden");
    if (undoBtn) undoBtn.classList.remove("hidden");
    if (redoBtn) redoBtn.classList.remove("hidden");
  } else {
    organizerToggleBtn.textContent = "🔒 Organizer Login";
    organizerToggleBtn.style.background = "#2563eb";
    organizerModeTag.classList.add("hidden");
    addParticipantBtn.classList.add("hidden");
    if (undoBtn) undoBtn.classList.add("hidden");
    if (redoBtn) redoBtn.classList.add("hidden");
  }
  updateUndoRedoButtons();
  render(allParticipants);
}

organizerToggleBtn.addEventListener("click", () => {
  if (isOrganizerUnlocked) {
    isOrganizerUnlocked = false;
    updateOrganizerUi();
  } else {
    dashPinModal.classList.remove("hidden");
    dashPinInput.value = "";
    dashPinError.textContent = "";
    dashPinInput.focus();
  }
});

function verifyDashPin() {
  if (dashPinInput.value.trim() === ADMIN_PIN) {
    isOrganizerUnlocked = true;
    dashPinModal.classList.add("hidden");
    updateOrganizerUi();
  } else {
    dashPinError.textContent = "Incorrect PIN. Try again.";
    dashPinInput.value = "";
    dashPinInput.focus();
  }
}

submitDashPinBtn.addEventListener("click", verifyDashPin);
dashPinInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") verifyDashPin();
});
cancelDashPinBtn.addEventListener("click", () => {
  dashPinModal.classList.add("hidden");
});

addParticipantBtn.addEventListener("click", async () => {
  if (!isOrganizerUnlocked) return;
  const nextNum = allParticipants.length + 1;
  const defaultId = `SOT${String(nextNum).padStart(3, "0")}`;
  
  const id = prompt("Enter Participant ID (e.g. SOT128):", defaultId);
  if (!id) return;
  
  const name = prompt("Enter Participant Name:", `Participant ${id.trim().toUpperCase()}`);
  if (!name) return;

  addParticipantBtn.textContent = "Adding...";
  addParticipantBtn.disabled = true;

  await addParticipant(id.trim().toUpperCase(), name.trim());
  await init();

  addParticipantBtn.textContent = "➕ Add Participant";
  addParticipantBtn.disabled = false;
});

const exportBtn = document.getElementById("exportCsvBtn");
if (exportBtn) {
  exportBtn.addEventListener("click", exportExcelCSV);
}
