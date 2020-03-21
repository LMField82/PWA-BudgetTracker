const indexedDB = window.indexedDB || 
    window.mozIndexdedDB || 
    window.webkitIndexedDB || 
    msIndexedDB || 
    window.shimIndexedDB;

let db;
//create new db request for a budget database
const request = window.indexedDB.open("budget", 1);
    
request.onupgradeneeded = function(event) {
    //create object store called "pending" and set to autoincrement to true
    const db = event.target.result;
    db.createObjectStore("pending", { autoIncrement: true });
};

request.onsuccess = function(event) {
    db = event.target.result;
    //check if app is online before reading from db
    if (navigator.onLine) {
        checkDatabase();
    }
};

request.onerror = function(event) {
    console.log(event.target.errorCode);
};

function saveRecord(record) {
    console.log("saving record in database ", record)
    //create a transaction on the pending db with CRUD (readwrite) access
    const transaction = db.transaction(["pending"], "readwrite");
    //access pending object store
    const store = transaction.objecStore("pending");
    //add record to store 
    store.add(record);
}

function checkDatabase() {
    //open a transaction on the pending db
    const transaction = db.transaction(["pending"], "readwrite");
    //access your pending object store
    const store = transaction.objectStore("pending");
    //get all records from store in a variable
    const getAll = store.getAll();

    getAll.onsuccess = function() {
        console.log(getAll.result)
        if (getAll.result.length > 0) {
            fetch("/api/transaction/bulk", {
                method: "POST",
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: "application/json, text/plain, */*",
                    "Content-Type": "application/json"
                }
            })
            .then(response => response.json())
            .then(() => {
                //if successful open transaction on pending db
                const transaction = db.transaction(["pending"], "readwrite");
                //access pending object store
                const store = transaction.objecStore("pending");
                //clear all items in store
                store.clear();
            }).catch(error => console.log(error));
        }
    };
}

window.addEventListener("onLine", checkDatabase);