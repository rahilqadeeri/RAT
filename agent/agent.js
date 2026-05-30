const { io } = require("socket.io-client");
const readline = require("readline");

const SERVER_URL = "https://rst.creativedesignit.in";

// Session code — argument se ya user input se
async function getSessionCode() {
  if (process.argv[2]) return process.argv[2].toUpperCase();
  
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question("Session Code daalo: ", (answer) => {
      rl.close();
      resolve(answer.trim().toUpperCase());
    });
  });
}

async function main() {
  console.log("=================================");
  console.log("  RemoteSupport Agent v1.0");
  console.log("  rst.creativedesignit.in");
  console.log("=================================\n");

  const sessionCode = await getSessionCode();
  
  if (!sessionCode) {
    console.log("Session code nahi diya!");
    process.exit(1);
  }

  console.log(`\nConnecting with code: ${sessionCode}...`);

  const socket = io(SERVER_URL, {
    transports: ["polling", "websocket"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  socket.on("connect", () => {
    console.log("✓ Server se connected!");
    socket.emit("agent-join", { roomId: sessionCode });
    console.log("✓ Session join ho gaya!");
    console.log("\nAdmin ab aapka system remote kar sakta hai.");
    console.log("Band karne ke liye Ctrl+C dabao.\n");
  });

  socket.on("mouse-move", ({ x, y }) => {
    // robotjs Windows exe mein hoga
    try { require("robotjs").moveMouse(x, y); } catch(e) {}
  });

  socket.on("mouse-click", ({ x, y, button }) => {
    try { 
      const robot = require("robotjs");
      robot.moveMouse(x, y); 
      robot.mouseClick(button || "left"); 
    } catch(e) {}
  });

  socket.on("mouse-double-click", ({ x, y }) => {
    try { 
      const robot = require("robotjs");
      robot.moveMouse(x, y); 
      robot.mouseClick("left", true); 
    } catch(e) {}
  });

  socket.on("mouse-scroll", ({ y }) => {
    try { require("robotjs").scrollMouse(0, y > 0 ? 3 : -3); } catch(e) {}
  });

  socket.on("key-press", ({ key, modifier }) => {
    try { 
      const robot = require("robotjs");
      if (modifier) robot.keyTap(key, modifier);
      else robot.keyTap(key);
    } catch(e) {}
  });

  socket.on("key-type", ({ text }) => {
    try { require("robotjs").typeString(text); } catch(e) {}
  });

  socket.on("disconnect", () => {
    console.log("Server se disconnect ho gaya. Reconnecting...");
  });

  socket.on("connect_error", (err) => {
    console.log("Connection error:", err.message);
  });

  process.on("SIGINT", () => {
    console.log("\nAgent band ho raha hai...");
    socket.disconnect();
    process.exit(0);
  });
}

main();
