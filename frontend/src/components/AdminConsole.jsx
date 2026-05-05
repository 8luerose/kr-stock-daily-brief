import React, { useState, useEffect } from 'react';
import { runAdminAction, loadSummaryArchive } from '../services/apiClient';
import { Settings, Play, Database, CheckSquare, Server, AlertCircle } from 'lucide-react';
import styles from './AdminConsole.module.css';
import clsx from 'clsx';

export default function AdminConsole({ asOf }) {
  const [adminKey, setAdminKey] = useState('');
  const [logs, setLogs] = useState([]);
  const [loadingAction, setLoadingAction] = useState(null);
  const [archive, setArchive] = useState(null);

  useEffect(() => {
    let mounted = true;
    loadSummaryArchive().then(data => {
      if (mounted) setArchive(data);
    });
    return () => { mounted = false; };
  }, []);

  const addLog = (msg, type = 'info') => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${type.toUpperCase()}: ${msg}`, ...prev]);
  };

  const handleAction = async (actionName, label) => {
    if (!adminKey) {
      addLog('Admin Key를 입력해주세요.', 'error');
      return;
    }
    setLoadingAction(actionName);
    addLog(`${label} 시작...`);
    try {
      const res = await runAdminAction(actionName, adminKey);
      addLog(`${label} 완료: ${JSON.stringify(res).substring(0, 100)}...`, 'success');
    } catch (err) {
      addLog(`${label} 실패: ${err.message}`, 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Settings className={styles.headerIcon} size={28} />
        <div>
          <h2>관리자 및 시스템 기록</h2>
          <p>브리프 생성, 백필, 검증 및 보관된 데이터를 관리합니다.</p>
        </div>
      </header>

      <div className={styles.content}>
        <section className={styles.actionSection}>
          <div className={styles.keyInput}>
            <label>Admin Key</label>
            <input 
              type="password" 
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="관리자 키를 입력하세요"
            />
          </div>

          <div className={styles.actionGrid}>
            <button 
              className={styles.actionBtn} 
              onClick={() => handleAction('today', '오늘의 브리프 생성')}
              disabled={loadingAction !== null}
            >
              <Play size={18} />
              <span>오늘 브리프 생성</span>
            </button>
            
            <button 
              className={styles.actionBtn} 
              onClick={() => handleAction('backfill', '과거 데이터 백필')}
              disabled={loadingAction !== null}
            >
              <Database size={18} />
              <span>데이터 백필</span>
            </button>

            <button 
              className={styles.actionBtn} 
              onClick={() => handleAction('verify', '데이터 무결성 검증')}
              disabled={loadingAction !== null}
            >
              <CheckSquare size={18} />
              <span>데이터 검증</span>
            </button>
          </div>

          <div className={styles.logs}>
            <h3>시스템 로그</h3>
            <div className={styles.logBox}>
              {logs.length === 0 ? (
                <p className={styles.emptyLog}>실행된 작업이 없습니다.</p>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className={clsx(styles.logLine, log.includes('ERROR') && styles.logError, log.includes('SUCCESS') && styles.logSuccess)}>
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className={styles.archiveSection}>
          <h3>과거 브리프 보관소</h3>
          {archive ? (
            <div className={styles.archiveList}>
              {archive.list.map((item, i) => (
                <div key={i} className={styles.archiveCard}>
                  <div className={styles.archiveHeader}>
                    <strong>{item.date} 브리프</strong>
                  </div>
                  <div className={styles.archiveStats}>
                    <span className={styles.statTag}>상승: {item.topGainer}</span>
                    <span className={styles.statTag}>하락: {item.topLoser}</span>
                    <span className={styles.statTag}>테마: {item.mostMentioned}</span>
                  </div>
                  <p className={styles.archiveDesc}>{item.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.loading}>보관소 데이터를 불러오는 중...</div>
          )}
        </section>
      </div>
    </div>
  );
}
