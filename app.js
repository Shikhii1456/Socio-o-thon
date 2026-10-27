// Shared Cloud Database Integration for Socio-O-Thon
const ADMIN_PIN = "1234";
const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1_l9WvZ9ZJzhhij0QR0IRe388gP2lt-RNctH2qeErW9U/export?format=csv";
const GOOGLE_SHEET_API_URL = "https://script.google.com/macros/s/AKfycbw7p21WbHuWVn3iclq8PUCjpfDZrCXQEkpZMuV8TruuZtNcIJjzU1zw5hNEiVtJqUVg/exec";
const LOCAL_STORAGE_KEY = "socioOthon_participants_v5";

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
    "id": "SOT019",
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
    "id": "SOT020",
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
    "id": "SOT021",
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
    "id": "SOT022",
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
    "id": "SOT023",
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
    "id": "SOT024",
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
    "id": "SOT025",
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
    "id": "SOT026",
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
    "id": "SOT027",
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
    "id": "SOT028",
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
    "id": "SOT029",
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
    "id": "SOT030",
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
    "id": "SOT031",
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
    "id": "SOT032",
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
    "id": "SOT033",
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
    "id": "SOT034",
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
    "id": "SOT035",
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
    "id": "SOT036",
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
    "id": "SOT037",
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
    "id": "SOT038",
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
    "id": "SOT039",
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
    "id": "SOT040",
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
    "id": "SOT041",
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
    "id": "SOT042",
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
    "id": "SOT043",
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
    "id": "SOT044",
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
    "id": "SOT045",
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
    "id": "SOT046",
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
    "id": "SOT047",
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
    "id": "SOT048",
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
    "id": "SOT049",
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
    "id": "SOT050",
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
    "id": "SOT051",
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
    "id": "SOT052",
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
    "id": "SOT053",
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
    "id": "SOT054",
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
    "id": "SOT055",
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
    "id": "SOT056",
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
    "id": "SOT057",
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
    "id": "SOT058",
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
    "id": "SOT059",
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
    "id": "SOT060",
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
    "id": "SOT061",
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
    "id": "SOT062",
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
    "id": "SOT063",
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
    "id": "SOT064",
    "name": "Dhruv Vinod Vishwakarma",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "26pe3007@rgipt.ac.in",
      "Contact": "8828036271"
    }
  },
  {
    "id": "SOT065",
    "name": "Arshiya",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "Arshiya130809@gmail.com",
      "Contact": "8828036271"
    }
  },
  {
    "id": "SOT066",
    "name": "Toyshi Choudhary",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "toyshi01k@gmail.com",
      "Contact": "6378787309"
    }
  },
  {
    "id": "SOT067",
    "name": "Om sahu",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "26ce3034@rgipt.ac.in",
      "Contact": "9201883639"
    }
  },
  {
    "id": "SOT068",
    "name": "Nelaballi Dheeraj Samuel",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "26ce3032@rgipt.ac.in",
      "Contact": "7569811612"
    }
  },
  {
    "id": "SOT069",
    "name": "Mahi Kumari",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "mahisahani99@gmail.com",
      "Contact": "09569893990"
    }
  },
  {
    "id": "SOT070",
    "name": "Rishika Singh",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "darcy2706already@gmail.com",
      "Contact": "8318284773"
    }
  },
  {
    "id": "SOT071",
    "name": "Yash Jaiswal",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "26cd3035@rgipt.ac.in",
      "Contact": "8840018140"
    }
  },
  {
    "id": "SOT072",
    "name": "Tarun Singh",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "26mc3066@rgipt.ac.in",
      "Contact": "8894486898"
    }
  },
  {
    "id": "SOT073",
    "name": "Palak P",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "25re3016@rgipt.ac.in",
      "Contact": "6204883242"
    }
  },
  {
    "id": "SOT074",
    "name": "Kriti Kumari Singh",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "25ce3030@rgipt.ac.in",
      "Contact": "7439501227"
    }
  },
  {
    "id": "SOT075",
    "name": "Sreeraj Basak",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "26ce3053@rgipt.ac.in",
      "Contact": "8276079672"
    }
  },
  {
    "id": "SOT076",
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
    "id": "SOT077",
    "name": "PUNEETH PUDI",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "25pe3044@rgipt.ac.in",
      "Contact": "7382175526"
    }
  },
  {
    "id": "SOT078",
    "name": "Shreyansh Singh",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "26it3036@rgipt.ac.in",
      "Contact": "9006846272"
    }
  },
  {
    "id": "SOT079",
    "name": "Abhishek Ekka",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {
      "Email": "26ce3002@rgipt.ac.in",
      "Contact": "9348638467"
    }
  },
  {
    "id": "SOT080",
    "name": "On-Spot Participant 01",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {}
  },
  {
    "id": "SOT081",
    "name": "On-Spot Participant 02",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {}
  },
  {
    "id": "SOT082",
    "name": "On-Spot Participant 03",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {}
  },
  {
    "id": "SOT083",
    "name": "On-Spot Participant 04",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {}
  },
  {
    "id": "SOT084",
    "name": "On-Spot Participant 05",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {}
  },
  {
    "id": "SOT085",
    "name": "On-Spot Participant 06",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {}
  },
  {
    "id": "SOT086",
    "name": "On-Spot Participant 07",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {}
  },
  {
    "id": "SOT087",
    "name": "On-Spot Participant 08",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {}
  },
  {
    "id": "SOT088",
    "name": "On-Spot Participant 09",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {}
  },
  {
    "id": "SOT089",
    "name": "On-Spot Participant 10",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {}
  },
  {
    "id": "SOT090",
    "name": "On-Spot Participant 11",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {}
  },
  {
    "id": "SOT091",
    "name": "On-Spot Participant 12",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {}
  },
  {
    "id": "SOT092",
    "name": "On-Spot Participant 13",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {}
  },
  {
    "id": "SOT093",
    "name": "On-Spot Participant 14",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {}
  },
  {
    "id": "SOT094",
    "name": "On-Spot Participant 15",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {}
  },
  {
    "id": "SOT095",
    "name": "On-Spot Participant 16",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {}
  },
  {
    "id": "SOT096",
    "name": "On-Spot Participant 17",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {}
  },
  {
    "id": "SOT097",
    "name": "On-Spot Participant 18",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {}
  },
  {
    "id": "SOT098",
    "name": "On-Spot Participant 19",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {}
  },
  {
    "id": "SOT099",
    "name": "On-Spot Participant 20",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {}
  },
  {
    "id": "SOT100",
    "name": "On-Spot Participant 21",
    "status": {
      "kit": false,
      "accommodation": false,
      "food": false
    },
    "fields": {}
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
        const upper = val.toUpperCase();
        if (upper === "YES" || upper === "NO" || upper === "TRUE" || upper === "FALSE") {
          status[h] = isTruthy(val);
        } else {
          fields[h] = val;
        }
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

  if (baseList.length === 0) {
    baseList = [...defaultSeed];
  }

  // 2. Fetch live Google Sheet CSV to overlay real-time status updates (kit/accommodation/food)
  try {
    const res = await fetch(GOOGLE_SHEET_CSV_URL + "&_t=" + Date.now());
    if (res.ok) {
      const csv = await res.text();
      const parsed = parseParticipantsFromCSV(csv);
      if (parsed && parsed.length > 0) {
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

        // Add any newly created participants found in Google Sheet
        parsed.forEach(sp => {
          const isDeleted = sp.name && (/deleted/i.test(sp.name) || /not\s*paid/i.test(sp.name));
          if (!isDeleted && !baseList.some(bp => bp.id.toUpperCase() === sp.id.toUpperCase())) {
            baseList.push(sp);
          }
        });
      }
    }
  } catch (err) {
    console.warn("Could not load from Google Sheet CSV, using local sources:", err);
  }

  // 3. Overlay any offline or local modifications / additions from localStorage
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (saved) {
    try {
      const localList = JSON.parse(saved);
      if (Array.isArray(localList) && localList.length > 0) {
        const localMap = new Map(localList.map(p => [p.id.toUpperCase(), p]));
        baseList = baseList.map(p => {
          const fromLocal = localMap.get(p.id.toUpperCase());
          if (fromLocal) {
            return {
              ...p,
              ...fromLocal,
              status: fromLocal.status || p.status,
              fields: (fromLocal.fields !== undefined) ? fromLocal.fields : p.fields
            };
          }
          return p;
        });

        // Crucial: Append any newly added participants stored in localStorage
        localList.forEach(lp => {
          if (!baseList.some(bp => bp.id.toUpperCase() === lp.id.toUpperCase())) {
            baseList.push(lp);
          }
        });
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
  const upperId = id.trim().toUpperCase();
  const list = await fetchParticipantsFromCloud();
  const existing = list.find(p => p.id.toUpperCase() === upperId);
  if (existing) {
    alert("Participant with ID " + upperId + " already exists!");
    return { ok: false, error: "Duplicate ID" };
  }
  recordState(list);
  const newParticipant = {
    id: upperId,
    name: name ? name.trim() : ("Participant " + upperId),
    status: { kit: false, accommodation: false, food: false },
    fields: {}
  };
  list.push(newParticipant);
  list.sort((a, b) => {
    const numA = parseInt(String(a.id).replace(/\D/g, ""), 10) || 0;
    const numB = parseInt(String(b.id).replace(/\D/g, ""), 10) || 0;
    return numA - numB;
  });
  await saveParticipantsToCloud(list);
  await syncParticipantToGoogleSheet(newParticipant);
  return { ok: true, participant: newParticipant };
}

async function updateParticipantInfo(oldId, newId, newName) {
  const cleanOld = oldId.trim().toUpperCase();
  const cleanNew = newId.trim().toUpperCase();
  const list = await fetchParticipantsFromCloud();
  const target = list.find(p => p.id.toUpperCase() === cleanOld);
  if (!target) return false;

  if (cleanOld !== cleanNew) {
    const duplicate = list.find(p => p.id.toUpperCase() === cleanNew);
    if (duplicate) {
      alert("Error: Another participant already has ID " + cleanNew);
      return false;
    }
  }

  recordState(list);
  target.id = cleanNew;
  target.name = newName.trim();

  list.sort((a, b) => {
    const numA = parseInt(String(a.id).replace(/\D/g, ""), 10) || 0;
    const numB = parseInt(String(b.id).replace(/\D/g, ""), 10) || 0;
    return numA - numB;
  });

  await saveParticipantsToCloud(list);

  if (cleanOld !== cleanNew) {
    try {
      await fetch(GOOGLE_SHEET_API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_participant", id: cleanOld })
      });
    } catch (e) {}
  }

  await syncParticipantToGoogleSheet(target);
  return true;
}

async function deleteParticipant(id) {
  const upperId = id.trim().toUpperCase();
  if (!confirm(`Are you sure you want to delete participant ${upperId}?`)) return false;
  const list = await fetchParticipantsFromCloud();
  recordState(list);
  const filtered = list.filter(p => p.id.toUpperCase() !== upperId);
  filtered.sort((a, b) => {
    const numA = parseInt(String(a.id).replace(/\D/g, ""), 10) || 0;
    const numB = parseInt(String(b.id).replace(/\D/g, ""), 10) || 0;
    return numA - numB;
  });
  await saveParticipantsToCloud(filtered);

  try {
    await fetch(GOOGLE_SHEET_API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "delete_participant",
        id: upperId
      })
    });
  } catch (e) {
    console.warn("Sheet delete error:", e);
  }
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


// ── In-Memory QR Code Cache for Instant Performance ──
const qrCache = new Map();
let activeQrQueue = [];
let qrAnimationId = null;

function generateQR(containerId, url) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (el.dataset.rendered === "true") return;

  if (qrCache.has(url)) {
    el.innerHTML = qrCache.get(url);
    el.dataset.rendered = "true";
    return;
  }

  el.innerHTML = "";
  new QRCode(el, {
    text: url,
    width: 180,
    height: 180,
    correctLevel: QRCode.CorrectLevel.M
  });
  el.dataset.rendered = "true";
  setTimeout(() => {
    if (el.innerHTML && !qrCache.has(url)) {
      qrCache.set(url, el.innerHTML);
    }
  }, 100);
}

function processQRQueue() {
  if (!activeQrQueue.length) return;
  const chunk = activeQrQueue.splice(0, 8);
  chunk.forEach(item => generateQR(item.id, item.url));
  if (activeQrQueue.length > 0) {
    qrAnimationId = requestAnimationFrame(processQRQueue);
  }
}

// Ensure all QRs complete immediately before printing
window.addEventListener("beforeprint", () => {
  if (qrAnimationId) cancelAnimationFrame(qrAnimationId);
  while (activeQrQueue.length) {
    const item = activeQrQueue.shift();
    generateQR(item.id, item.url);
  }
});

function render(list) {
  const grid = document.getElementById("participantGrid");
  grid.innerHTML = "";
  document.getElementById("participantCount").textContent = list.length;

  if (qrAnimationId) cancelAnimationFrame(qrAnimationId);
  activeQrQueue = [];

  if (!list.length) {
    grid.innerHTML = `<div class="empty">No participants found.</div>`;
    return;
  }

  const fragment = document.createDocumentFragment();

  list.forEach((p, idx) => {
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

    const organizerControls = isOrganizerUnlocked
      ? `<div style="display:flex; gap:4px;">
           <button class="button small secondary edit-btn" style="padding:4px 8px; font-size:11px;" title="Edit Name/ID">✏️ Edit</button>
           <button class="button small secondary del-btn" style="padding:4px 8px; font-size:11px; color:#ef4444;" title="Delete">🗑️</button>
         </div>`
      : "";

    const qrId = `qr-${p.id}`;
    card.innerHTML = `
      <div class="participant-meta" style="display:flex; justify-content:space-between; align-items:center;">
        <div style="display:flex; align-items:center; gap:6px;">
          <span class="id-pill">${escapeHtml(p.id)}</span>
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
    fragment.appendChild(card);

    if (idx < 12) {
      setTimeout(() => generateQR(qrId, pUrl), 0);
    } else {
      activeQrQueue.push({ id: qrId, url: pUrl });
    }

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

  grid.appendChild(fragment);

  if (activeQrQueue.length > 0) {
    qrAnimationId = requestAnimationFrame(processQRQueue);
  }

  grid.querySelectorAll(".copy-btn").forEach(btn => {
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
  // 1. Instant Paint from LocalStorage or defaultSeed (0ms delay!)
  const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        allParticipants = parsed;
        render(allParticipants);
      }
    } catch (e) {}
  }
  if (!allParticipants.length) {
    allParticipants = [...defaultSeed];
    render(allParticipants);
  }

  // 2. Refresh from Google Sheet in background without UI freeze
  try {
    const fresh = await getParticipants();
    if (fresh && fresh.length > 0) {
      allParticipants = fresh;
      const searchVal = document.getElementById("search").value.toLowerCase().trim();
      if (!searchVal) {
        render(allParticipants);
      }
    }
  } catch (err) {
    console.warn("Background refresh note:", err.message);
  }
}

init();

// ── Debounced Search for 60 FPS Performance ──
let searchTimer = null;
document.getElementById("search").addEventListener("input", e => {
  clearTimeout(searchTimer);
  const q = e.target.value.toLowerCase().trim();
  searchTimer = setTimeout(() => {
    render(allParticipants.filter(p =>
      p.id.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      (p.fields && Object.values(p.fields).some(v => String(v).toLowerCase().includes(q)))
    ));
  }, 100);
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

let pinFailCount = 0;
let pinLockoutUntil = 0;
let inactivityTimer = null;

function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  if (isOrganizerUnlocked) {
    inactivityTimer = setTimeout(() => {
      isOrganizerUnlocked = false;
      updateOrganizerUi();
      console.log("Organizer mode locked due to 10-minute inactivity.");
    }, 10 * 60 * 1000);
  }
}

["click", "keydown", "touchstart"].forEach(evt => {
  window.addEventListener(evt, () => {
    if (isOrganizerUnlocked) resetInactivityTimer();
  }, { passive: true });
});

function verifyDashPin() {
  const now = Date.now();
  if (now < pinLockoutUntil) {
    const remaining = Math.ceil((pinLockoutUntil - now) / 1000);
    dashPinError.textContent = "Too many attempts. Locked for " + remaining + "s.";
    return;
  }

  if (dashPinInput.value.trim() === ADMIN_PIN) {
    pinFailCount = 0;
    isOrganizerUnlocked = true;
    dashPinModal.classList.add("hidden");
    updateOrganizerUi();
    resetInactivityTimer();
  } else {
    pinFailCount++;
    if (pinFailCount >= 5) {
      pinLockoutUntil = Date.now() + 30000;
      dashPinError.textContent = "5 incorrect attempts. Locked for 30s.";
    } else {
      dashPinError.textContent = "Incorrect PIN (" + (5 - pinFailCount) + " attempts left).";
    }
    dashPinInput.value = "";
    dashPinInput.focus();
  }
}

if (submitDashPinBtn) submitDashPinBtn.addEventListener("click", verifyDashPin);
if (dashPinInput) {
  dashPinInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") verifyDashPin();
  });
}
if (cancelDashPinBtn) {
  cancelDashPinBtn.addEventListener("click", () => {
    dashPinModal.classList.add("hidden");
  });
}
if (dashPinModal) {
  dashPinModal.addEventListener("click", (e) => {
    if (e.target === dashPinModal) dashPinModal.classList.add("hidden");
  });
}
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && dashPinModal && !dashPinModal.classList.contains("hidden")) {
    dashPinModal.classList.add("hidden");
  }
});

addParticipantBtn.addEventListener("click", async () => {
  if (!isOrganizerUnlocked) return;
  const nextNum = allParticipants.length + 1;
  const defaultId = "SOT" + String(nextNum).padStart(3, "0");
  
  const id = prompt("Enter Participant ID (e.g. " + defaultId + "):", defaultId);
  if (!id || !id.trim()) return;
  
  const name = prompt("Enter Participant Name:", "Participant " + id.trim().toUpperCase());
  if (!name || !name.trim()) return;

  addParticipantBtn.textContent = "Adding...";
  addParticipantBtn.disabled = true;

  try {
    const res = await addParticipant(id.trim().toUpperCase(), name.trim());
    if (res && res.ok) {
      await init();
    }
  } catch (err) {
    console.error("Add participant failed:", err);
    alert("Error adding participant: " + err.message);
  } finally {
    addParticipantBtn.textContent = "➕ Add Participant";
    addParticipantBtn.disabled = false;
  }
});

const exportBtn = document.getElementById("exportCsvBtn");
if (exportBtn) {
  exportBtn.addEventListener("click", exportExcelCSV);
}
