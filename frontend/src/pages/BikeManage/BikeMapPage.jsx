import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Spin, Tag, message, Button, Drawer, Descriptions } from 'antd';
import { EnvironmentOutlined, ReloadOutlined } from '@ant-design/icons';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { getMapLocations } from '../../api/bike';
import { BIKE_STATUS, BIKE_MARKER_COLORS } from '../../utils/constants';

/** Create colored circle divIcon for bike markers with hover effect */
function createBikeIcon(status, isSelected = false) {
  const color = BIKE_MARKER_COLORS[status] || '#999';
  const size = isSelected ? 22 : 16;
  const borderWidth = isSelected ? 3 : 2;
  return L.divIcon({
    className: 'bike-marker-icon',
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;background:${color};
      border:${borderWidth}px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4);
      transition:all 0.2s ease;cursor:pointer;
    " title="${status}"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

/** Create cluster icon that shows count and can be clicked to zoom in */
function createClusterIcon(count) {
  const size = Math.min(60, 30 + count * 2);
  return L.divIcon({
    className: 'bike-cluster-icon',
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:rgba(22,119,255,0.85);color:#fff;cursor:pointer;
      display:flex;align-items:center;justify-content:center;
      font-size:14px;font-weight:bold;border:3px solid #fff;
      box-shadow:0 3px 12px rgba(0,0,0,0.4);transition:all 0.2s;
    ">${count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/** Component to handle map click on empty area to deselect */
function MapClickHandler({ onMapClick }) {
  useMapEvents({ click: onMapClick });
  return null;
}

/** Simple grid-based clustering */
function clusterBikes(bikes, gridSize) {
  const groups = new Map();
  for (const bike of bikes) {
    const gridLat = Math.round(bike.latitude / gridSize) * gridSize;
    const gridLng = Math.round(bike.longitude / gridSize) * gridSize;
    const key = `${gridLat.toFixed(5)},${gridLng.toFixed(5)}`;
    if (!groups.has(key)) {
      groups.set(key, { lat: gridLat, lng: gridLng, count: 0, bikes: [], key });
    }
    const g = groups.get(key);
    g.count++;
    g.bikes.push(bike);
  }
  return Array.from(groups.values());
}

function getGridSize(zoom) {
  if (zoom >= 17) return 0.0001;
  if (zoom >= 15) return 0.0005;
  if (zoom >= 13) return 0.002;
  if (zoom >= 11) return 0.01;
  return 0.05;
}

export default function BikeMapPage() {
  const [bikes, setBikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBike, setSelectedBike] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(13);
  const timerRef = useRef(null);
  const mapRef = useRef(null);

  const fetchLocations = useCallback(async () => {
    try {
      const res = await getMapLocations();
      setBikes(res.data || []);
      setLoading(false);
    } catch (err) {
      message.error(err.message);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
    timerRef.current = setInterval(fetchLocations, 5000);
    return () => clearInterval(timerRef.current);
  }, [fetchLocations]);

  const handleBikeClick = useCallback((bike) => {
    setSelectedBike(bike);
    setDrawerOpen(true);
  }, []);

  const handleMapClick = useCallback(() => {
    // Clicking empty map area deselects
    if (selectedBike) {
      setSelectedBike(null);
    }
  }, [selectedBike]);

  const handleClusterClick = useCallback((cluster) => {
    // Zoom into cluster
    if (mapRef.current) {
      const map = mapRef.current;
      map.flyTo([cluster.lat, cluster.lng], Math.min(18, map.getZoom() + 2), { duration: 0.5 });
    }
  }, []);

  // Build markers from clustered data
  const clusters = clusterBikes(bikes, getGridSize(currentZoom));

  return (
    <div style={{ position: 'relative' }}>
      {/* Toolbar */}
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Button icon={<ReloadOutlined />} onClick={fetchLocations} loading={loading}>
          刷新位置
        </Button>
        <Tag color="blue">共 {bikes.length} 辆车</Tag>
        {selectedBike && (
          <Tag color="green">已选中: {selectedBike.bike_no}</Tag>
        )}
      </div>

      <div style={{ display: 'flex', gap: 16, minHeight: 400, height: 'calc(100vh - 240px)', flexWrap: 'wrap' }}>
        {/* Map */}
        <div style={{ flex: '1 1 300px', minWidth: 280, borderRadius: 8, overflow: 'hidden', position: 'relative', minHeight: 350 }}>
          {loading && (
            <Spin size="large" style={{ position: 'absolute', top: 16, right: 16, zIndex: 1000 }} />
          )}
          <MapContainer
            ref={mapRef}
            center={[39.915, 116.404]}
            zoom={13}
            style={{ height: '100%', width: '100%', minHeight: 350 }}
            whenReady={(map) => {
              mapRef.current = map.target;
              map.target.on('zoomend', () => setCurrentZoom(map.target.getZoom()));
            }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap'
            />
            <MapClickHandler onMapClick={handleMapClick} />

            {clusters.map((cluster) => {
              if (cluster.count === 1) {
                const bike = cluster.bikes[0];
                const isSelected = selectedBike?.id === bike.id;
                return (
                  <Marker
                    key={`bike-${bike.id}`}
                    position={[bike.latitude, bike.longitude]}
                    icon={createBikeIcon(bike.status, isSelected)}
                    eventHandlers={{
                      click: () => handleBikeClick(bike),
                    }}
                  >
                    <Popup>
                      <div style={{ minWidth: 160 }}>
                        <strong>{bike.bike_no}</strong><br />
                        状态: <Tag color={BIKE_STATUS[bike.status]?.color}>{BIKE_STATUS[bike.status]?.label}</Tag><br />
                        电量: {bike.battery_level}%<br />
                        坐标: {Number(bike.latitude).toFixed(4)}, {Number(bike.longitude).toFixed(4)}
                      </div>
                    </Popup>
                  </Marker>
                );
              }

              return (
                <Marker
                  key={`cluster-${cluster.key}`}
                  position={[cluster.lat, cluster.lng]}
                  icon={createClusterIcon(cluster.count)}
                  eventHandlers={{
                    click: () => handleClusterClick(cluster),
                  }}
                />
              );
            })}
          </MapContainer>
        </div>

        {/* Legend Panel */}
        <div style={{ width: 210, minWidth: 180, flexShrink: 0 }}>
          <Card title="图例" size="small" style={{ marginBottom: 12 }}>
            {Object.entries(BIKE_STATUS).map(([key, val]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }}>
                <div style={{
                  width: 14, height: 14, borderRadius: '50%',
                  backgroundColor: BIKE_MARKER_COLORS[key],
                  border: '2px solid #fff',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                  flexShrink: 0,
                }} />
                <span style={{ fontSize: 13, lineHeight: '20px' }}>{val.label}</span>
              </div>
            ))}
          </Card>

          <Card title="操作提示" size="small">
            <p style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>🖱️ 点击标记查看详情</p>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>🔍 点击聚合圈放大</p>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 0 }}>🗺️ 点击空白取消选中</p>
          </Card>
        </div>
      </div>

      {/* Bike Detail Drawer */}
      <Drawer
        title={selectedBike ? `单车详情 - ${selectedBike.bike_no}` : ''}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={360}
      >
        {selectedBike && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="车辆编号">{selectedBike.bike_no}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={BIKE_STATUS[selectedBike.status]?.color}>
                {BIKE_STATUS[selectedBike.status]?.label}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="电量">{selectedBike.battery_level}%</Descriptions.Item>
            <Descriptions.Item label="纬度">{Number(selectedBike.latitude).toFixed(6)}</Descriptions.Item>
            <Descriptions.Item label="经度">{Number(selectedBike.longitude).toFixed(6)}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  );
}
