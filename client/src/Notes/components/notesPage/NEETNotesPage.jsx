// NEETNotesPage.js
import { Box, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';

export default function NEETNotesPage() {
  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '70vh',
      textAlign: 'center',
      p: 3
    }}>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 700, color: 'primary.main' }}>
        NEET Notes Collection
      </Typography>
      <Typography variant="body1" sx={{ mb: 3, maxWidth: '600px' }}>
        We're currently compiling the best NEET study materials for you. Our team is working hard to 
        provide comprehensive notes, practice questions, and revision materials.
      </Typography>
      <Box sx={{
        backgroundColor: '#fef3c7',
        borderLeft: '4px solid #f59e0b',
        p: 3,
        borderRadius: '4px',
        mb: 4,
        maxWidth: '600px'
      }}>
        {/* <Typography variant="body1" sx={{ color: '#92400e' }}>
          <strong>Update:</strong> The NEET notes section will be available by August 30th, 2023. 
          Check back soon or sign up for notifications below.
        </Typography> */}
      </Box>
      <Button 
        variant="contained" 
        size="large"
        sx={{ mb: 2 }}
        disabled
      >
        Notify Me When Available
      </Button>
      <Button 
        component={Link}
        to="/"
        variant="outlined"
        size="large"
      >
        Back to Home
      </Button>
    </Box>
  );
}