import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';
import { useState } from 'react';

interface AddEventDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (event: {
    title: string;
    date: string;
    time: string;
    location: string;
    attendees: string[];
  }) => void;
}

export function AddEventDialog({ open, onClose, onAdd }: AddEventDialogProps) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [attendees, setAttendees] = useState('');

  const handleSubmit = () => {
    if (title && date && time) {
      onAdd({
        title,
        date,
        time,
        location,
        attendees: attendees.split(',').map(a => a.trim()).filter(Boolean)
      });
      setTitle('');
      setDate('');
      setTime('');
      setLocation('');
      setAttendees('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Event</DialogTitle>
      <DialogContent>
        <div className="space-y-4 pt-2">
          <TextField
            label="Event Title"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <TextField
            label="Date"
            type="date"
            fullWidth
            value={date}
            onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Time"
            type="time"
            fullWidth
            value={time}
            onChange={(e) => setTime(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Location (optional)"
            fullWidth
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <TextField
            label="Family Members (comma separated)"
            fullWidth
            value={attendees}
            onChange={(e) => setAttendees(e.target.value)}
            placeholder="Mom, Dad, Kids"
          />
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!title || !date || !time}>
          Add Event
        </Button>
      </DialogActions>
    </Dialog>
  );
}
