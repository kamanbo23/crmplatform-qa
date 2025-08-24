import React from 'react';
import { Card, CardContent, Box, Typography, Chip, Avatar, Skeleton } from '@mui/material';
import { motion } from 'framer-motion';

const MotionCard = motion(Card);

export default function EnhancedCard({ 
  children, 
  title, 
  subtitle, 
  avatar, 
  avatarColor = 'primary.main',
  chips = [],
  loading = false,
  onClick,
  elevation = 1,
  sx = {},
  ...props 
}) {
  const cardVariants = {
    initial: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    animate: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    },
    hover: {
      y: -8,
      scale: 1.02,
      transition: {
        duration: 0.2,
        ease: "easeInOut"
      }
    },
    tap: {
      scale: 0.98,
      transition: {
        duration: 0.1
      }
    }
  };

  if (loading) {
    return (
      <MotionCard
        variants={cardVariants}
        initial="initial"
        animate="animate"
        elevation={elevation}
        sx={{
          height: '100%',
          cursor: 'pointer',
          ...sx
        }}
        {...props}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Skeleton variant="circular" width={48} height={48} />
            <Box sx={{ ml: 2, flex: 1 }}>
              <Skeleton variant="text" width="60%" height={24} />
              <Skeleton variant="text" width="40%" height={16} />
            </Box>
          </Box>
          <Skeleton variant="text" width="100%" height={16} />
          <Skeleton variant="text" width="80%" height={16} />
          <Skeleton variant="text" width="60%" height={16} />
        </CardContent>
      </MotionCard>
    );
  }

  return (
    <MotionCard
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover={onClick ? "hover" : undefined}
      whileTap={onClick ? "tap" : undefined}
      elevation={elevation}
      onClick={onClick}
      sx={{
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: `linear-gradient(90deg, ${avatarColor}, ${avatarColor}88)`,
          transform: 'scaleX(0)',
          transition: 'transform 0.3s ease-in-out',
        },
        '&:hover::before': {
          transform: 'scaleX(1)',
        },
        ...sx
      }}
      {...props}
    >
      <CardContent sx={{ p: 3 }}>
        {(title || avatar) && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            {avatar && (
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  mr: 2,
                  backgroundColor: avatarColor,
                  fontSize: '1.25rem',
                  fontWeight: 600,
                }}
              >
                {avatar}
              </Avatar>
            )}
            <Box sx={{ flex: 1 }}>
              {title && (
                <Typography variant="h6" component="h3" fontWeight="600" gutterBottom>
                  {title}
                </Typography>
              )}
              {subtitle && (
                <Typography variant="body2" color="text.secondary">
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Box>
        )}
        
        {chips.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {chips.map((chip, index) => (
              <Chip
                key={index}
                label={chip.label}
                size="small"
                color={chip.color || 'default'}
                variant={chip.variant || 'outlined'}
                sx={{ fontSize: '0.75rem' }}
              />
            ))}
          </Box>
        )}
        
        {children}
      </CardContent>
    </MotionCard>
  );
} 