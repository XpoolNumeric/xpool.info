const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'pages', 'AvailableRides.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace the book-trip invoke block
const oldBookTrip = `const { data: response, error: invokeError } = await supabase.functions.invoke('book-trip', {
                  body: {
                      trip_id: ride.id,
                      passenger_id: user.id,
                      seats_requested: passengers,
                      payment_mode: 'online',
                      message: "Looking forward to the ride!",
                      passenger_location: passengerLoc,
                      passenger_destination: passengerDest
                  }
              });

              if (invokeError || (response && !response.success)) {
                  throw new Error(invokeError?.message || response?.error || "Failed to book trip");
              }
              
              const request = response.data;
              
              // Wait briefly for UI animation, then forward to wait-approval with ID
              setTimeout(() => {
                navigate(\`/wait-approval?request_id=\${request.id}\`);
              }, 800);`;

const newBookTrip = `// Use centralized edge function API
              const edgeResult = await bookTrip({
                  tripId: ride.id,
                  passengerId: user.id,
                  seatsRequested: passengers,
                  paymentMode: 'online',
                  message: 'Looking forward to the ride!',
                  passengerLocation: passengerLoc,
                  passengerDestination: passengerDest
              });

              if (!edgeResult.success) {
                  throw new Error(edgeResult.error || 'Failed to book trip');
              }
              
              const request = edgeResult.data;
              
              // Notify driver about the booking in background
              if (request?.id) {
                notifyDriverBooking(request.id, ride.id, request.driver_user_id || '').catch(() => {});
              }
              
              // Wait briefly for UI animation, then forward to wait-approval with ID
              setTimeout(() => {
                navigate(\`/wait-approval?request_id=\${request.id}\`);
              }, 800);`;

if (content.includes("supabase.functions.invoke('book-trip'")) {
  content = content.replace(oldBookTrip, newBookTrip);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('SUCCESS: AvailableRides.tsx book-trip updated');
} else {
  console.log('book-trip invoke not found, checking encoding...');
  // Try with different quote variants
  const idx = content.indexOf('book-trip');
  if (idx > -1) {
    console.log('Found book-trip at index', idx);
    console.log('Context bytes:', Buffer.from(content.substring(idx-5, idx+15)).toString('hex'));
  } else {
    console.log('book-trip string not found anywhere');
  }
}
