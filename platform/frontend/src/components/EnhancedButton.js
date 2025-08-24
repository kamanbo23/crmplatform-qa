import React from 'react';
import { Button, CircularProgress, Box } from '@mui/material';
import { motion } from 'framer-motion';

const MotionButton = motion(Button);

export default function EnhancedButton({
  children,
  loading = false,
  loadingText = 'Loading...',
  icon,
  iconPosition = 'start',
  variant = 'contained',
  size = 'medium',
  color = 'primary',
  fullWidth = false,
  disabled = false,
  onClick,
  sx = {},
  ...props
}) {
  const buttonVariants = {
    initial: { scale: 1 },
    hover: { 
      scale: 1.02,
      transition: { duration: 0.2 }
    },
    tap: { 
      scale: 0.98,
      transition: { duration: 0.1 }
    },
    loading: { scale: 1 }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small': return 16;
      case 'large': return 24;
      default: return 20;
    }
  };

  const renderIcon = () => {
    if (loading) {
      return (
        <CircularProgress
          size={getIconSize()}
          color="inherit"
          sx={{ mr: iconPosition === 'start' ? 1 : 0, ml: iconPosition === 'end' ? 1 : 0 }}
        />
      );
    }
    
    if (icon) {
      return React.cloneElement(icon, {
        sx: { 
          fontSize: getIconSize(),
          mr: iconPosition === 'start' ? 1 : 0,
          ml: iconPosition === 'end' ? 1 : 0
        }
      });
    }
    
    return null;
  };

  return (
    <MotionButton
      variant={variant}
      size={size}
      color={color}
      fullWidth={fullWidth}
      disabled={disabled || loading}
      onClick={onClick}
      variants={buttonVariants}
      initial="initial"
      whileHover={!loading && !disabled ? "hover" : "initial"}
      whileTap={!loading && !disabled ? "tap" : "initial"}
      animate={loading ? "loading" : "initial"}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        fontWeight: 600,
        letterSpacing: '0.025em',
        textTransform: 'none',
        borderRadius: '12px',
        minHeight: size === 'large' ? 48 : size === 'small' ? 32 : 40,
        px: size === 'large' ? 3 : size === 'small' ? 2 : 2.5,
        py: size === 'large' ? 1.5 : size === 'small' ? 0.75 : 1,
        fontSize: size === 'large' ? '1rem' : size === 'small' ? '0.875rem' : '0.875rem',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
          transition: 'left 0.5s',
        },
        '&:hover::before': {
          left: '100%',
        },
        '&:disabled': {
          opacity: 0.6,
          cursor: 'not-allowed',
        },
        ...sx
      }}
      {...props}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        width: '100%'
      }}>
        {iconPosition === 'start' && renderIcon()}
        {loading ? loadingText : children}
        {iconPosition === 'end' && renderIcon()}
      </Box>
    </MotionButton>
  );
} 