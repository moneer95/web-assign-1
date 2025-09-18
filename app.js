const prompt = require("prompt-sync")({ sigint: true });
const fs = require('fs/promises')


/**
 * Builds a formatted view of a single photo by ID.
 * Looks up the raw photo, adds a human-readable date, and resolves album IDs to names.
 * Returns an object with id, filename, title, formattedDate, albumNames, and tags.
 * Returns undefined if no photo is found for the given id.
 * @param id Photo ID to format.
 * @returns A formatted photo object or undefined.
 */
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



/**
 * Updates a photo's title and description by ID.
 * Prompts the user for new values (keeps old values if inputs are empty),
 * then writes the updated photos list back to disk.
 * Does nothing if the photo is not found.
 * @param id Photo ID to update.
 * @returns Nothing.
 */
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



/**
 * Returns a list of formatted photos that belong to the given album name.
 * Matching is currently case-sensitive because it uses a direct includes check.
 * @param albumName The album name to filter by.
 * @returns An array of formatted photos in that album.
 */
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


/**
 * Adds a single tag to a photo by ID and saves the change.
 * If the photo is not found, no changes are made.
 * @param id Photo ID to tag.
 * @returns Nothing.
 */
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


/**
 * Finds and returns a raw photo object (unformatted) by ID.
 * Logs a message and returns undefined if not found.
 * @param id Photo ID to search for.
 * @returns The matching raw photo or undefined.
 */
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




/**
 * Resolves an array of album IDs to their names (lowercased).
 * If none are found, returns an object like { name: 'No Album for this ID' }.
 * Consider normalizing this to always return an array for easier downstream use.
 * @param ids List of album IDs to resolve.
 * @returns An array of album names, or an object indicating none found.
 */
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



/**
 * Reads a JSON file from disk and parses it.
 * Throws if the file cannot be read or the contents are not valid JSON.
 * @param fileName Path to the JSON file.
 * @returns The parsed JSON content.
 */
async function readFile(fileName) {
    const jsonContent = await fs.readFile(fileName, 'utf8')
    const content = JSON.parse(jsonContent)

    return content
}


/**
 * Serializes data as pretty JSON and writes it to photos.json.
 * Overwrites the file and logs a confirmation on success.
 * @param data Any serializable data structure to persist.
 * @returns Nothing.
 */
async function writeFile(data) {
    const jsonContent = JSON.stringify(data, null, 2)
    await fs.writeFile('photos.json', jsonContent)
    console.log('file updated')

}






/**
 * Prints the interactive console menu for the photo manager.
 * No return value.
 */
function showMenu() {

    console.log("\n=== Photo Management Menu ===");
    console.log("1. Find Photo");
    console.log("2. Update Photo Details");
    console.log("3. Album Photo List");
    console.log("4. Tag Photo");
    console.log("5. Exit");
}




let exit = false;
/**
 * Runs the interactive loop:
 * - Shows the menu
 * - Reads the user's choice
 * - Performs the selected action until Exit is chosen
 * Handles async operations for each menu item.
 * No return value.
 */
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