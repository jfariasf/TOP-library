const BOOK_READ_URL = "https://i.imgur.com/fuliKu4.png";
const BOOK_NOTREAD_URL = "https://i.imgur.com/lQG2XCT.png";

let form_container = document.querySelector(".form_container");
let book_template = document.querySelector("#book_template");
let container = document.querySelector("#container");
let bg_overlay = document.querySelector("#bg_overlay");
let form_flag = false;
let newItems = false;

bg_overlay.addEventListener("click", (event)=>{
    toggleForm();
})
// No local copy and Book will be used as model only.
function Book(title, author, pages, read, id) {
    this.id = id;
    this.title = title;
    this.author = author;
    this.pages = pages;
    this.read = read;
    this.info = function(){
        return this.title+" by "+this.author+", "+this.pages+" pages, "+(this.read)?"already read":"not read yet";
    }
}
function addBookToLibrary() {
    let form = form_container.querySelector("#form");
    let title = form.querySelector("#form_title").value;
    let author = form.querySelector("#form_author").value;
    let pages = form.querySelector("#form_pages").value;
    let read = form.querySelector("#form_read").checked;
    let newPostKey = firebase.database().ref().child('books').push().key;
    let lastBook = new Book(title, author, pages, read, newPostKey);

    firebase.database().ref("books/"+newPostKey).set(formatForFirebase(lastBook));
    form.reset();
    toggleForm();
}

function toggleRead(e){
    let currentVal = e.target.src;
    let book = e.target.parentNode.parentNode.parentNode.parentNode;
    let book_id = book.id; 

    currentVal = (currentVal == BOOK_READ_URL) ? false:true;
    firebase.database().ref("books/"+book_id).update(formatForFirebase({read: currentVal}));
}

function formatForFirebase(object){
    return JSON.parse(JSON.stringify(object));
}

function cloneBookTemplate(book){
    let clone = book_template.cloneNode(true);

    clone.id = book.id;
    clone.style.display = "";
    clone.querySelector(".title").innerHTML = book.title;
    clone.querySelector(".author").innerHTML = book.author;
    clone.querySelector(".pages").innerHTML = book.pages;
    
    clone.querySelector(".book_read_link").src = (book.read)? BOOK_READ_URL: BOOK_NOTREAD_URL;
    return clone;
}

function displayBook(clone){
    container.appendChild(clone);
}

function removeBook(book){
    let book_to_remove = book.target.parentNode.parentNode.parentNode;
    let bookid = book_to_remove.id;

    firebase.database().ref("books/"+bookid).remove();
}

function toggleForm(){
    if(form_flag){
       // form_container.style.display = "none";
        bg_overlay.classList.remove("overlay");
        form_container.classList.add("form_container_hidden");
        form_flag = false;
    }
    else{
        bg_overlay.classList.add("overlay");
        
        form_container.classList.remove("form_container_hidden");
        form_flag = true;
    }
}

function syncWithFirebase(data){
    if(data == null){
        console.log("nothing found");
        return;
    }
    data.forEach(function(bookObj){
        let book = bookObj.val();
        let firebase_book = new Book(book.title, book.author, book.pages, book.read, book.id)
        let clone = cloneBookTemplate(firebase_book);
        displayBook(clone);
    });

    newItems = true;
}

function onBookAdded(data){
    // avoid being triggered after removal or first load
    if (!newItems || container.querySelector("#"+data.id)) { return } 

    let book = new Book(data.title, data.author, data.pages, data.read,data.id);
    let clone = cloneBookTemplate(book);

    displayBook(clone);
}

function onBookRemoved(book){
   let delbook = container.querySelector("#"+book.id);
   container.removeChild(delbook);
}

function onBookChanged(book){
    let clone = cloneBookTemplate(book);
    let current = container.querySelector("#"+book.id);
    container.replaceChild(clone, current);
}

let dbPointer = firebase.database().ref("books/");
dbPointer.once('value', snap => syncWithFirebase( snap));
dbPointer.limitToLast(1).on('child_added', snap => onBookAdded(snap.val()));
dbPointer.on('child_removed', snap => onBookRemoved(snap.val()));
dbPointer.on('child_changed', snap => onBookChanged( snap.val()));