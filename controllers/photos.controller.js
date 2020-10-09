const Photo = require('../models/photo.model');
const Voter = require('../models/voter.model');
const requestIp = require('request-ip');

/* function escape special characters  */
function escape(html) {
  return html.replace(/&/g, "")
             .replace(/</g, "")
             .replace(/>/g, "")
             .replace(/"/g, "")
             .replace(/'/g, "");
}

function validateEmail(email) {
  const correctEmail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return correctEmail.toLowerCase();
}

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {

  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;

    if(title && author && email && file) { // if fields are not empty...
      if((title.length > 25) && (author.length > 50)) {
        throw new Error('Wrong input!');
        res.status(500).json(err);
      }
      else {
        const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
        const fileExt = fileName.split('.').slice(-1)[0]; // cut only filetype from filename, e.g. abc.jpg -> jpg 
        if(fileExt !== ('jpg' || 'png' || 'gif')){
          throw new Error('Wrong input!');
        }
        else{
          const titleCorrect = escape(title);
          const authorCorrect = escape(author);
          const emailCorrect = validateEmail(email);

          const newPhoto = new Photo({ title: titleCorrect, author: authorCorrect, email: emailCorrect, src: fileName, votes: 0 });
          await newPhoto.save(); // ...save new photo in DB
          res.json(newPhoto);
        }
      }
    }
      else {
        throw new Error('Wrong input!');
      }
      
  }catch(err) {
    res.status(500).json(err);
  }

};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {

  try {
    res.json(await Photo.find());
  } catch(err) {
    res.status(500).json(err);
  }

};

/****** VOTE FOR PHOTO ********/
exports.vote = async (req, res) => {
  
  const clientIp = requestIp.getClientIp(req);
  const isVoter = await Voter.findOne({ user: clientIp });
  const photoToUpdate = await Photo.findOne({ _id: req.params.id });
  
  try {

    if(!photoToUpdate) res.status(404).json({ message: 'Not found' });
    else {
      if(!isVoter) {
        const newVoter = new Voter({ user: clientIp, votes: [req.params.id] });
        newVoter.save();
        photoToUpdate.votes++;
        photoToUpdate.save();
        res.send({ message: 'OK' });
      } else if (isVoter.votes.includes(photoToUpdate._id)) {
        throw new Error('You already liked this photo');
      } else {
        isVoter.votes.push(req.params.id)
        isVoter.save();
        photoToUpdate.votes++;
        photoToUpdate.save();
        res.send({ message: 'OK' });
      }
    }
  } catch(err) {
    res.status(500).json(err);
  }

};