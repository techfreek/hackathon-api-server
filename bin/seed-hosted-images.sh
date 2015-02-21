#!/bin/sh

echo "This script grabs a few dummy photos off the server. If nothing happens,"
echo "no worries! That means you've already seeded your photos directory."

hosted_images2=hosted-images/hackathon_02
hosted_images3=hosted-images/hackathon_03

## Create the directories if they don't exist
if [ ! -d $hosted_images2 ]; then mkdir -p $hosted_images2; fi
if [ ! -d ${hosted_images2}_mini ]; then mkdir ${hosted_images2}_mini; fi
if [ ! -d $hosted_images3 ]; then mkdir $hosted_images3; fi
if [ ! -d ${hosted_images3}_mini ]; then mkdir ${hosted_images3}_mini; fi

server_images_url=hackathon.eecs.wsu.edu/hosted_images/
images=
folder=
grab_images() {
  for image in $images; do
    wget -nvc ${server_images_url}$folder/$image -P hosted-images/$folder
    wget -nvc ${server_images_url}${folder}_mini/$image -P hosted-images/${folder}_mini
  done
}

images="IMG_0388.jpg IMG_0390.jpg IMG_0393.jpg IMG_0400.jpg IMG_0402.jpg IMG_0405.jpg"
folder=hackathon_02
grab_images

images="sticker.jpg IMG_6184-2.jpg IMG_6336.jpg IMG_6444.jpg IMG_6517.jpg IMG_7644.jpg IMG_6185.jpg"
folder=hackathon_03
grab_images