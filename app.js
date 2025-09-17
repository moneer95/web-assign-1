const fs = require('fs/promises')


async function formattedPhoto(id) {
    let photo = await findPhoto(id)

    if (!photo) {
        return
    }

    // add the formatted date
    photo['formattedDate'] = new Date(photo['date']).toLocaleDateString('en-us', {
        year: "numeric",
        month: "long",
        day: "numeric",
    })

    // get associated albums names
    photo['albumNames'] = await findAlbums(photo.albums)

    const { filename, title, formattedDate, albumNames, tags } = photo
    return { id, filename, title, formattedDate, albumNames, tags }

}


async function updatePhoto(id) {
    let photos = await readFile('photos.json')
    let newPhoto = await findPhoto(id)

    if (!newPhoto) {
        return
    }

    const newTitle = prompt('Enter New Title: ')
    const newDescription = prompt('Enter New description: ')

    newPhoto.title = newTitle ? newTitle : newPhoto.title
    newPhoto.description = newDescription ? newDescription : newPhoto.description

    for (let i = 0; i < photos.length; i++) {
        if (photos[i].id == newPhoto.id) {
            photos[i] = newPhoto
        }
    }

    await writeFile(photos)

}



async function getAlbumPhotoList(albumName) {
    let photos = await readFile('photos.json')

    let albumPhotos = []
    for (let i = 0; i < photos.length; i++) {

        let photo = await formattedPhoto(photos[i].id)
        if (photo.albumNames.includes(albumName)) {
            albumPhotos.push(photo)
        }
    }

    return albumPhotos

}


async function addTag(id) {
    let photos = await readFile('photos.json')
    let photo = await findPhoto(id)

    if(!photo){
        return
    }

    const newTag = prompt('Enter New Tag: ')

    for (let i = 0; i < photos.length; i++) {
        if (photos[i].id == photo.id) {
            photos[i].tags.push(newTag)
        }
    }

    await writeFile(photos)

}



async function findPhoto(id) {
    const photos = await readFile('photos.json')

    for (let i = 0; i < photos.length; i++) {
        if (photos[i].id == id) {
            return photos[i]
        }
    }

    //notify if not found
    console.log('no photo found with this id')
}

async function findAlbums(ids) {
    const albums = await readFile('albums.json')

    let foundAlbums = []
    for (let i = 0; i < albums.length; i++) {
        if (ids.includes(albums[i].id)) {
            foundAlbums.push(albums[i].name.toLowerCase())
        }
    }

    if (foundAlbums.length) {
        return foundAlbums
    }
    else {
        return ({ 'name': 'No Album for this ID' })
    }

}


async function readFile(fileName) {
    const jsonContent = await fs.readFile(fileName, 'utf8')
    const content = JSON.parse(jsonContent)

    return content
}

async function writeFile(data) {
    const jsonContent = JSON.stringify(data, null, 2)
    await fs.writeFile('photos.json', jsonContent)
    console.log('file updated')

}



// Import prompt-sync
const prompt = require("prompt-sync")({ sigint: true });

function showMenu() {

    console.log("\n=== Photo Management Menu ===");
    console.log("1. Find Photo");
    console.log("2. Update Photo Details");
    console.log("3. Album Photo List");
    console.log("4. Tag Photo");
    console.log("5. Exit");
}

let exit = false;

async function runProgram() {


    while (!exit) {
        showMenu();
        let choice = prompt("Your selection> ");

        switch (choice) {
            case "1": {

                const id = prompt("Enter Photo ID: ")
                const photo = await formattedPhoto(id)
                console.log(photo)

                break;
            }

            case "2": {

                const id = prompt("Enter Photo ID: ")
                await updatePhoto(id)

                break;
            }
            case "3": {

                const albumName = prompt("Enter Album Name: ").toLowerCase()
                const albumPhotoList = await getAlbumPhotoList(albumName)
                console.log(albumPhotoList)

                break;

            }
            case "4": {

                const id = prompt("Enter Photo ID: ")
                await addTag(id)

                break;

            }
            case "5":
                console.log("Exiting... Goodbye!");
                exit = true;

                break;
            default:
                console.log(" Invalid selection. Please enter 1–5.");
        }
    }


}


runProgram()