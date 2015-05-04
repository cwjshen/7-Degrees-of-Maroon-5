
# Final Project Design Studio     
###### Peer review by Mengting Zhang, Evan Sandhoefner, Ryan Kerr

### Broad Comments
1. **Main visualization seems a bit busy.**    
We will have a primary view that shows one artist and its related artists in focus, and the other artists are not as in focus.
2. **How will you decide which artists are the most related?**    
The 20 most related artists for a particular artist can be obtained from Spotify as an object. Among those 20, it is difficult to say which one is "most related," since Spotify does not provide that information explicitly. We do not plan on distinguishing among related artists of the same degree away from the main artist, but clearly first-degree related artists as a whole are more related than second-degree related artists.
3. **What will the nodes look like? Circle? Picture? Other?**  
The nodes will definitely be circular. The size will be larger for first-degree related artists, smaller for the second-degree related artists, even smaller for the third-degree artists, and so on. We will likely have a picture at the very least for the primary artist, if not also for the first-degree related artists. Having all of the nodes be pictures can make the visualization seem a little too busy, and the nodes beyond second-degree will be too small to see the pictures clearly anyway.
4. ** Transitioning: How will you transition from a main artist to another artist? Do you still display all artists?**  
The user will be able to jump from one artist to another. Ideally, by double-clicking, the user will be able to jump from Bruno Mars as the primary artist to Rhianna--one of his related artists--as the primary artist. Since the primary and first-degree nodes are larger than the rest, the focus will be on the new primary artist and its related artists. All artists will still be displayed in the background as smaller, more transparent nodes as to not take the attention away from the main stage. We want to keep all artists displayed in the background to give the user a picture of the primary artist in the context of everything else.

The feedback we received from Mengting, Evan, and Ryan were  very thoughtful and helpful. They offered some good points that we will definitely keep in mind as we move forward.