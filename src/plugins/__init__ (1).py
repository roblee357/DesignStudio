"""
This is where the implementation of the plugin code goes.
The Pl2-class is imported from both run_plugin.py and run_debug.py
"""
import sys
import logging
from webgme_bindings import PluginBase

# Setup a logger
logger = logging.getLogger('Pl2')
logger.setLevel(logging.INFO)
handler = logging.StreamHandler(sys.stdout)  # By default it logs to stderr..
handler.setLevel(logging.INFO)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)


class Pl2(PluginBase):
  def main(self):
    active_node = self.active_node
    core = self.core
    logger = self.logger
    logger.debug('path: {0}'.format(core.get_path(active_node)))
    logger.info('name: {0}'.format(core.get_attribute(active_node, 'name')))
    logger.warn('pos : {0}'.format(core.get_registry(active_node, 'position')))
    logger.error('guid: {0}'.format(core.get_guid(active_node)))
    
   # META = self.META
    # getting the necessary libraries    
    os = self.modules['os']    
    json = self.modules['json']    
    shutil = self.modules['shutil']    
    random = self.modules['random']    
 

    meta_path_lookup = {}
    for meta_name in self.META:
      meta_node = self.META[meta_name]
      path = core.get_path(meta_node)
      meta_path_lookup[path] = meta_name
      
    logger.info(json.dumps(meta_path_lookup,indent=4))
      
    #building structured data from model    
    nodes = core.load_sub_tree(active_node)
    global inits, ends   
    P2T = {}
    T2P = {}
    trans = {}
    places = {}
    inits = 0
    ends = 0
    freeChoice = True
    stateMachine = True
    markedGraph = True
    workflowNet = True
    
    
    def isFreeChoice():
      # Free-choice petri net - if the intersection of the inplaces sets of two transitions are not
      # empty, then the two transitions should be the same (or in short, each transition has its
      # own unique set if inplaces)
      for node in trans:
        for node2 in trans:
          if node != node2:
            if trans[node]['inplaces'] == trans[node2]['inplaces']:
              freeChoice = False
    
    def isStateMachine():          
      # State machine - a petri net is a state machine if every transition has exactly one inplace
      #  and one outplace.
      for node in trans:
        if len(trans[node]['inplaces']) != 1:
          stateMachine = False
        if len(trans[node]['outplaces']) != 1:
          stateMachine = False
          
          
    def isWorkflowNet():
      logger.info('running workflow check')
      if inits + ends != 2:
        workflowNet = False
    
    def isMarkedGraph():
     # Marked graph - a petri net is a marked graph if every place has exactly one out transition
     # and one in transition.
      logger.info('running marked graph check')
      for node in places:
        if len(places[node]['inplaces']) != 1:
          markedGraph = False
        if len(places[node]['outplaces']) != 1:
          markedGraph = False

    def lookupName(path):
      for node in nodes:
        if path == core.get_path(node):
          return core.get_fully_qualified_name(node)
    
    for node in nodes: 
      path = core.get_path(node)
      meta_node = core.get_meta_type(node)
#       meta_path = core.get_path(meta_node)
      if len(path)>0:
        meta_name = meta_path_lookup[meta_node['nodePath']]
 #       logger.info(meta_name)


  #      meta = meta_path_lookup[meta_path]
        name = core.get_fully_qualified_name(node)
        if 'Place2Trans' in meta_name:
          P2T[path] = {}
          P2T[path]['src'] = lookupName(core.get_pointer_path(node,"src"))
          P2T[path]['dst'] = lookupName(core.get_pointer_path(node,"dst"))

        if 'Trans2Place' in meta_name:
          T2P[path] = {}
          T2P[path]['src'] = lookupName(core.get_pointer_path(node,"src"))
          T2P[path]['dst'] = lookupName(core.get_pointer_path(node,"dst"))
          
    def list_trans():      
      global inits, ends
      for node in nodes: 
        path = core.get_path(node)
        meta_node = core.get_meta_type(node)
        if len(path)>0:
          meta_name = meta_path_lookup[meta_node['nodePath']]
          name = core.get_fully_qualified_name(node)     
          if  meta_name == 'Init':
            inits += 1
          if  meta_name == 'End':
            ends += 1  
          if  meta_name == 'Trans':
            trans[name]  = {} #Q[] 
            trans[name]['outplaces'] = []
            trans[name]['inplaces'] = []
            for node2 in nodes:
              path2 = core.get_path(node2)
              meta_node2 = core.get_meta_type(node2)
              if len(path2)>0:
                meta_name2 = meta_path_lookup[meta_node2['nodePath']]
                name2 = core.get_fully_qualified_name(node2)          
                if  'Place2Trans' in meta_name2:
                  scr_name = lookupName(core.get_pointer_path(node2,"src"))
                  dst_name = lookupName(core.get_pointer_path(node2,"dst"))
                  if dst_name is not None:
                    if dst_name == name:
                      trans[name]['inplaces'].append(scr_name)   
                if  'Trans2Place' in meta_name2:
                  scr_name = lookupName(core.get_pointer_path(node2,"src"))
                  dst_name = lookupName(core.get_pointer_path(node2,"dst"))
                  if scr_name is not None:
                    if scr_name == name:
                      link_name = scr_name + '->' + dst_name
                      trans[name]['outplaces'].append(dst_name)      
                      
    def list_places():      
      for node in nodes: 
        path = core.get_path(node)
        meta_node = core.get_meta_type(node)
        if len(path)>0:
          meta_name = meta_path_lookup[meta_node['nodePath']]
          name = core.get_fully_qualified_name(node)          
          if  meta_name == 'Place':
            places[name]  = {} 
            places[name]['outplaces'] = []
            places[name]['inplaces'] = []
            for node2 in nodes:
              path2 = core.get_path(node2)
              meta_node2 = core.get_meta_type(node2)
              if len(path2)>0:
                meta_name2 = meta_path_lookup[meta_node2['nodePath']]
                name2 = core.get_fully_qualified_name(node2)          
                if  'Place2Trans' in meta_name2:
                  scr_name = lookupName(core.get_pointer_path(node2,"dst"))
                  dst_name = lookupName(core.get_pointer_path(node2,"src"))
                  if dst_name is not None:
                    if dst_name == name:
                      places[name]['inplaces'].append(scr_name)   
                if  'Trans2Place' in meta_name2:
                  scr_name = lookupName(core.get_pointer_path(node2,"dst"))
                  dst_name = lookupName(core.get_pointer_path(node2,"src"))
                  if scr_name is not None:
                    if scr_name == name:
                      link_name = scr_name + '->' + dst_name
                      places[name]['outplaces'].append(dst_name)                         
                      
                
          
                      
    list_trans()
    list_places()
    isFreeChoice()
    isStateMachine()
    isMarkedGraph()
    isWorkflowNet()
    
    logger.info('ends {0}'.format(ends))
    logger.info('freeChoice {0}'.format(freeChoice))
    logger.info('stateMachine {0}'.format(stateMachine))
    logger.info('markedGraph {0}'.format(markedGraph))
    logger.info('workflowNet {0}'.format(workflowNet))

    
   # logger.info(json.dumps(P2T,indent=4)) 
   # logger.info(json.dumps(T2P,indent=4))
   # logger.info(json.dumps(trans,indent=4))
    logger.info(json.dumps(places,indent=4))

