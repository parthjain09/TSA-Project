import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, push, onValue, remove, onDisconnect } from 'firebase/database';

// This is a public development config. For production, these should be env vars.
// We're using a generic TSA project database for the demo.
const firebaseConfig = {
    apiKey: "AIzaSyAs-demo-key-123456789",
    authDomain: "signbridge-tsa.firebaseapp.com",
    databaseURL: "https://signbridge-tsa-default-rtdb.firebaseio.com",
    projectId: "signbridge-tsa",
    storageBucket: "signbridge-tsa.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);

export class MeetingManager {
    constructor(userId, userName) {
        this.userId = userId;
        this.userName = userName;
        this.roomCode = null;
    }

    // Generate a 6-digit room code
    generateRoomCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    // Create a new meeting room
    async createMeeting() {
        this.roomCode = this.generateRoomCode();
        const meetingRef = ref(database, `meetings/${this.roomCode}`);

        await set(meetingRef, {
            host: this.userId,
            createdAt: Date.now(),
            participants: {
                [this.userId]: {
                    name: this.userName,
                    active: true,
                    joinedAt: Date.now()
                }
            }
        });

        // Setup clean departure
        onDisconnect(ref(database, `meetings/${this.roomCode}/participants/${this.userId}`)).remove();

        return this.roomCode;
    }

    // Join an existing room
    async joinMeeting(code) {
        this.roomCode = code;
        const participantRef = ref(database, `meetings/${code}/participants/${this.userId}`);

        await set(participantRef, {
            name: this.userName,
            active: true,
            joinedAt: Date.now()
        });

        // Setup clean departure
        onDisconnect(participantRef).remove();
    }

    // Broadcast your live translation
    async sendTranslation(text) {
        if (!this.roomCode) return;
        const translationRef = ref(database, `meetings/${this.roomCode}/live/${this.userId}`);
        await set(translationRef, {
            name: this.userName,
            text: text,
            timestamp: Date.now()
        });
    }

    // Listen for everyone's translations
    listenToTranslations(callback) {
        if (!this.roomCode) return;
        const liveRef = ref(database, `meetings/${this.roomCode}/live`);
        return onValue(liveRef, (snapshot) => {
            const data = snapshot.val();
            callback(data || {});
        });
    }

    async leaveMeeting() {
        if (this.roomCode) {
            const participantRef = ref(database, `meetings/${this.roomCode}/participants/${this.userId}`);
            const liveRef = ref(database, `meetings/${this.roomCode}/live/${this.userId}`);
            await remove(participantRef);
            await remove(liveRef);
        }
    }
}
