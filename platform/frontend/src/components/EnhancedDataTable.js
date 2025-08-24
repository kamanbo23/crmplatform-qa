import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  TextField,
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Skeleton,
  Alert,
  InputAdornment,
  Menu,
  MenuItem,
  Button,
} from '@mui/material';
import {
  Search,
  FilterList,
  Sort,
  MoreVert,
  Refresh,
  Download,
  Visibility,
  Edit,
  Delete,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const MotionTableRow = motion(TableRow);

export default function EnhancedDataTable({
  data = [],
  columns = [],
  loading = false,
  error = null,
  title = '',
  subtitle = '',
  searchable = true,
  pagination = true,
  actions = [],
  onRefresh,
  onExport,
  sx = {},
  ...props
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);

  // Filter and sort data
  const filteredData = useMemo(() => {
    let filtered = data;

    // Apply search filter
    if (searchTerm && searchable) {
      filtered = filtered.filter(row =>
        columns.some(column => {
          const value = row[column.field];
          if (value && typeof value === 'string') {
            return value.toLowerCase().includes(searchTerm.toLowerCase());
          }
          return false;
        })
      );
    }

    // Apply sorting
    if (sortBy) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data, searchTerm, sortBy, sortDirection, columns, searchable]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return filteredData;
    const startIndex = page * rowsPerPage;
    return filteredData.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredData, page, rowsPerPage, pagination]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleActionMenuOpen = (event, row) => {
    setAnchorEl(event.currentTarget);
    setSelectedRow(row);
  };

  const handleActionMenuClose = () => {
    setAnchorEl(null);
    setSelectedRow(null);
  };

  const renderCell = (row, column) => {
    const value = row[column.field];

    if (column.render) {
      return column.render(value, row);
    }

    if (column.type === 'chip') {
      return (
        <Chip
          label={value}
          size="small"
          color={column.chipColor || 'default'}
          variant={column.chipVariant || 'outlined'}
        />
      );
    }

    if (column.type === 'date') {
      return new Date(value).toLocaleDateString();
    }

    if (column.type === 'datetime') {
      return new Date(value).toLocaleString();
    }

    return value;
  };

  const tableVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const rowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  if (error) {
    return (
      <Paper sx={{ p: 3, ...sx }}>
        <Alert severity="error">{error}</Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ overflow: 'hidden', ...sx }} {...props}>
      {/* Header */}
      {(title || searchable || onRefresh || onExport) && (
        <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              {title && (
                <Typography variant="h6" fontWeight="600" gutterBottom>
                  {title}
                </Typography>
              )}
              {subtitle && (
                <Typography variant="body2" color="text.secondary">
                  {subtitle}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {onRefresh && (
                <Tooltip title="Refresh">
                  <IconButton onClick={onRefresh} disabled={loading}>
                    <Refresh />
                  </IconButton>
                </Tooltip>
              )}
              {onExport && (
                <Tooltip title="Export">
                  <IconButton onClick={onExport}>
                    <Download />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>

          {searchable && (
            <TextField
              fullWidth
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          )}
        </Box>
      )}

      {/* Table */}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.field}
                  align={column.align || 'left'}
                  sx={{
                    fontWeight: 600,
                    cursor: column.sortable ? 'pointer' : 'default',
                    '&:hover': column.sortable ? { backgroundColor: 'action.hover' } : {},
                  }}
                  onClick={() => column.sortable && handleSort(column.field)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {column.headerName}
                    {column.sortable && sortBy === column.field && (
                      <Sort
                        sx={{
                          transform: sortDirection === 'desc' ? 'rotate(180deg)' : 'none',
                          fontSize: 16,
                        }}
                      />
                    )}
                  </Box>
                </TableCell>
              ))}
              {actions.length > 0 && (
                <TableCell align="center" sx={{ width: 80 }}>
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            <AnimatePresence>
              {loading ? (
                // Loading skeleton
                Array.from({ length: rowsPerPage }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    {columns.map((column) => (
                      <TableCell key={column.field}>
                        <Skeleton variant="text" />
                      </TableCell>
                    ))}
                    {actions.length > 0 && (
                      <TableCell>
                        <Skeleton variant="circular" width={24} height={24} />
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                // Actual data
                paginatedData.map((row, index) => (
                  <MotionTableRow
                    key={row.id || index}
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    sx={{
                      '&:hover': { backgroundColor: 'action.hover' },
                    }}
                  >
                    {columns.map((column) => (
                      <TableCell key={column.field} align={column.align || 'left'}>
                        {renderCell(row, column)}
                      </TableCell>
                    ))}
                    {actions.length > 0 && (
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={(e) => handleActionMenuOpen(e, row)}
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    )}
                  </MotionTableRow>
                ))
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {pagination && !loading && (
        <TablePagination
          component="div"
          count={filteredData.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleActionMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {actions.map((action, index) => (
          <MenuItem
            key={index}
            onClick={() => {
              action.onClick(selectedRow);
              handleActionMenuClose();
            }}
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            {action.icon}
            {action.label}
          </MenuItem>
        ))}
      </Menu>
    </Paper>
  );
} 