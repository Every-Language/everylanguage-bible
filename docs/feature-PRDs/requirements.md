This is an audio first Bible app built with the tech stack outlined in the tech-stack.md file

There is already a backend project set up in supabase postgres and supabase auth which has automatically generated typescript types, these are imported as the @everylanguage/shared-types package

Features

- offline first
- Performance even on low spec devices

Language selection

- each user (or unauthenticated user) Has a list of my languages
- A user can add to their list of my languages from the language selection screen
- This displays a hierarchical view of the language_entities from which the user can select one, adding it to their languages
- Adding a language to the list of my languages should start a sync process in which all of the Bible audio from that language is pulled from the server onto the local device

Bible screen

- Display cards for each of the old Testament in new Testament books in the Bible.
- When a book is clicked a pop-up opens with the chapters from that book. Users can choose to open a chapter play it add it to the queue or add it to the Library.
- When a chapter is opened The content of that pop-up changes to the verses of that chapter. Uses can play from a specific verse or add a 1st to the Library
- The books chapters and verses are taken from the corresponding models in supabase.

Media player

- Always visible at the bottom of the screen
- Has two views collapsed and expanded
- User and swipe up on the collapse for you to expand
- Plays the current media file

Analytics

- All user data is tracked through the analytic models
- Analytics should still work off-line and the event should be stored in a local queue to be sent to the server when the device comes back online
